<?php
/**
 * Kontaktní formulář – odešle zprávu e-mailem.
 *
 * Anti-spam: honeypot `website` + hCaptcha invisible (`h-captcha-response`
 * → ověření přes api.hcaptcha.com/siteverify).
 *
 * Response: pro `Accept: application/json` (AJAX) JSON s `errors`
 * (per-field) a `message` (obecné). Jinak text/plain pro no-JS fallback,
 * při úspěchu + `Accept: text/html` redirect na /odeslano.
 */

declare(strict_types=1);

// Marker, podle kterého config.php / config.local.php pozná, že jsou
// načítány legitimně přes `require` z tohoto souboru. Kdyby někdo
// obešel .htaccess a sáhl na config přímo přes URL, die() ho zastaví.
define('REDOME_CONTACT_BOOT', true);

define('IS_PRODUCTION', $_SERVER['SERVER_NAME'] === 'www.redome.cz');

$wantsJson = str_contains((string)($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json');

/**
 * Sjednocená odpověď. Pro AJAX (Accept: application/json) vrací JSON,
 * jinak plain text – zachováme tím no-JS fallback.
 *
 * @param array{ok?: bool, message?: string, errors?: array<string, string>} $payload
 */
function respond(int $status, array $payload): void
{
    global $wantsJson;

    http_response_code($status);

    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        exit;
    }

    header('Content-Type: text/plain; charset=utf-8');
    if (!empty($payload['errors'])) {
        // Pro no-JS klienta slijeme per-field chyby do jedné věty.
        echo 'Zkontrolujte prosím pole: ' . implode(', ', array_keys($payload['errors']));
        exit;
    }
    echo $payload['message'] ?? ($payload['ok'] ?? false ? 'OK' : 'Chyba.');
    exit;
}

// --- Načtení konfigurace ---------------------------------------------------
$config = require __DIR__ . '/config.php';

$localOverride = __DIR__ . '/config.local.php';
if (is_file($localOverride)) {
    $config = array_replace_recursive($config, require $localOverride);
}

$hcaptchaSiteKey = (string)($config['hcaptcha']['site_key'] ?? '');
$hcaptchaSecret  = (string)($config['hcaptcha']['secret']   ?? '');
$mailTo          = (string)($config['mail']['to']           ?? 'redome@redome.cz');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'message' => 'Tato adresa přijímá pouze POST.']);
}

// Honeypot – pokud robot vyplnil skryté pole, tváříme se OK,
// ale zprávu zahodíme
if (!empty($_POST['website'] ?? '')) {
    respond(200, ['ok' => true]);
}

// --- hCaptcha verifikace ---------------------------------------------------
if ($hcaptchaSecret === '' || $hcaptchaSiteKey === '') {
    error_log('contact.php: chybí hcaptcha.secret nebo hcaptcha.site_key v configu');
    respond(500, [
        'ok' => false,
        'message' => 'Server není správně nakonfigurován. Zavolejte nám prosím přímo.',
    ]);
}

$token = trim((string)($_POST['h-captcha-response'] ?? ''));
if ($token === '') {
    respond(422, [
        'ok' => false,
        'message' => 'Chybí ověření proti spamu. Obnovte stránku a zkuste to znovu.',
    ]);
}

/**
 * Ověří token proti hCaptcha API.
 *
 * @return array{0: bool, 1: list<string>}  [success, error-codes]
 */
function verifyHCaptcha(string $token, string $secret, string $siteKey, string $ip): array
{
    $payload = http_build_query([
        'secret'   => $secret,
        'response' => $token,
        'remoteip' => $ip,
        'sitekey'  => $siteKey,
    ]);

    $ctx = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => "Content-type: application/x-www-form-urlencoded\r\n",
            'content'       => $payload,
            'timeout'       => 5,
            'ignore_errors' => true,
        ],
    ]);
    $raw = @file_get_contents('https://api.hcaptcha.com/siteverify', false, $ctx);
    if ($raw === false) {
        return [false, ['siteverify-unreachable']];
    }
    $json = json_decode($raw, true);
//    echo print_r($json, true);die();
    if (!is_array($json)) {
        return [false, ['siteverify-invalid-response']];
    }
    if (!empty($json['success'])) {
        return [true, []];
    }
    return [false, $json['error-codes'] ?? ['unknown']];
}

[$captchaOk, $captchaErrors] = verifyHCaptcha(
    $token,
    $hcaptchaSecret,
    $hcaptchaSiteKey,
    (string)($_SERVER['REMOTE_ADDR'] ?? '')
);
if (!$captchaOk) {
    error_log('contact.php: hCaptcha verify failed: ' . implode(',', $captchaErrors));
    respond(422, [
        'ok' => false,
        'message' => 'Ověření proti spamu selhalo. Obnovte stránku a zkuste to znovu.',
    ]);
}

/**
 * Normalizuje telefonní číslo do kanonického `+CCNNNNNNNNN` tvaru.
 *
 * Akceptuje:
 *   - holé 9místné číslo (CZ lokál) → doplní `+420`
 *   - mezinárodní s `+` nebo `00` prefixem (E.164, 1–3 cifry CC + národní)
 *
 * Stripuje mezery, pomlčky, závorky, tečky, lomítka.
 * Vrací `null` při neplatném vstupu.
 */
function normalizePhone(string $raw): ?string
{
    $clean = preg_replace('/[\s\-\(\)\.\/]/u', '', $raw);
    if ($clean === null || $clean === '') {
        return null;
    }

    // `+` na začátku převedeme na `00`, aby zbývala jen čísla.
    $hadPlus = $clean[0] === '+';
    if ($hadPlus) {
        $clean = '00' . substr($clean, 1);
    }

    // Po normalizaci musí být všechno čísla.
    if (!preg_match('/^\d+$/', $clean)) {
        return null;
    }

    $len = strlen($clean);

    // S `+` prefixem (převedeným na `00`) → vždy mezinárodní formát.
    // E.164 maximum 15 cifer národní + CC → +2 za prefix = 17.
    if ($hadPlus) {
        return ($len >= 10 && $len <= 17) ? '+' . substr($clean, 2) : null;
    }

    // Bez `+` prefixu: 9 cifer = CZ lokál, doplníme +420.
    // (Vyhodnocuje se DŘÍV než test na "00", aby `000 000 000` prošlo
    // jako lokál a ne jako příliš krátké mezinárodní číslo.)
    if ($len === 9) {
        return '+420' . $clean;
    }

    // Bez `+`, ale začíná `00` (zapsaný mezinárodní prefix) → mezinárodní.
    if (substr($clean, 0, 2) === '00' && $len >= 10 && $len <= 17) {
        return '+' . substr($clean, 2);
    }

    return null;
}

// --- Validace polí ---------------------------------------------------------
// Per-field chyby (klíč = `name` atributu v HTML formuláři), aby klient mohl
// chybu zobrazit přímo u příslušného inputu přes `input.setCustomValidity()`.
$name    = trim((string)($_POST['name']    ?? ''));
$email   = trim((string)($_POST['email']   ?? ''));
$phoneIn = trim((string)($_POST['phone']   ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

$phone = $phoneIn !== '' ? normalizePhone($phoneIn) : null;

/** @var array<string, string> $fieldErrors */
$fieldErrors = [];
if ($name === '') {
    $fieldErrors['name'] = 'Zadejte prosím své jméno.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $fieldErrors['email'] = 'Zadejte platnou e-mailovou adresu.';
}
if ($phoneIn === '' || $phone === null) {
    $fieldErrors['phone'] = 'Zadejte prosím platné telefonní číslo.';
}
if ($message === '') {
    $fieldErrors['message'] = 'Napište nám prosím krátkou zprávu.';
}

if ($fieldErrors !== []) {
    respond(422, [
        'ok' => false,
        'message' => 'Zkontrolujte prosím pole označená červeně.',
        'errors'  => $fieldErrors,
    ]);
}

// Sanitizace hlaviček – zabráníme injekci CRLF do Subject/From/Reply-To
$strip = static fn(string $s): string => str_replace(["\r", "\n"], ' ', $s);

$subject = '[Redome.cz] Nová zpráva od ' . $strip($name);
$body    = sprintf(
    "Jméno:   %s\nE-mail:  %s\nTelefon: %s\n\nZpráva:\n%s\n",
    $name,
    $email,
    $phone,
    $message
);

$headers = implode("\r\n", [
    'From: Redome.cz <noreply@redome.cz>',
    'Reply-To: ' . $strip($email),
    'Content-Type: text/plain; charset=utf-8',
    'X-Mailer: redome.cz/contact.php',
]);

if (!mail($mailTo, $subject, $body, $headers)) {
    respond(500, [
        'ok' => false,
        'message' => 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu nebo nám zavolejte.',
    ]);
}

// No-JS fallback: prohlížeč, který přišel přes normální form POST
// (Accept obsahuje text/html), přesměrujeme na potvrzovací stránku.
if (!$wantsJson && str_contains((string)($_SERVER['HTTP_ACCEPT'] ?? ''), 'text/html')) {
    header('Location: /odeslano');
    exit;
}

respond(200, ['ok' => true]);
