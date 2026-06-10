<?php
/**
 * Kontaktní formulář – odešle zprávu e-mailem.
 *
 * Vývoj: PHP CLI server v Dockeru, mail() přes msmtp → Mailpit
 * Produkce: stejný PHP soubor v dist/api/, hosting Apache + PHP
 *
 * Bez captchy (zatím), proti spamu jen honeypot pole `website`.
 */

declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Tato adresa přijímá pouze POST.';
    exit;
}

// Honeypot – pokud robot vyplnil skryté pole, tváříme se OK,
// ale zprávu zahodíme
if (!empty($_POST['website'] ?? '')) {
    http_response_code(200);
    echo 'OK';
    exit;
}

$name    = trim((string)($_POST['name']    ?? ''));
$email   = trim((string)($_POST['email']   ?? ''));
$phone   = trim((string)($_POST['phone']   ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

$errors = [];
if ($name === '')                                  $errors[] = 'jméno';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))    $errors[] = 'e-mail';
if ($message === '')                               $errors[] = 'zpráva';

if ($errors !== []) {
    http_response_code(422);
    echo 'Chybí nebo má neplatný formát: ' . implode(', ', $errors);
    exit;
}

// Sanitizace hlaviček – zabráníme injekci CRLF do Subject/From/Reply-To
$strip = static fn(string $s): string => str_replace(["\r", "\n"], ' ', $s);

$to      = getenv('CONTACT_TO') ?: 'redome@redome.cz';
$subject = '[Redome.cz] Nová zpráva od ' . $strip($name);
$body    = sprintf(
    "Jméno:   %s\nE-mail:  %s\nTelefon: %s\n\nZpráva:\n%s\n",
    $name,
    $email,
    $phone !== '' ? $phone : '–',
    $message
);

$headers = implode("\r\n", [
    'From: Redome.cz <noreply@redome.cz>',
    'Reply-To: ' . $strip($email),
    'Content-Type: text/plain; charset=utf-8',
    'X-Mailer: redome.cz/contact.php',
]);

if (!mail($to, $subject, $body, $headers)) {
    http_response_code(500);
    echo 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu nebo nám zavolejte.';
    exit;
}

// Pokud klient přišel z prohlížeče bez fetch/JS, vrátíme ho na potvrzovací stránku
if (str_contains((string)($_SERVER['HTTP_ACCEPT'] ?? ''), 'text/html')) {
    header('Location: /odeslano');
    exit;
}

http_response_code(200);
echo 'OK';
