<?php
/**
 * Konfigurace backendu (kontaktní formulář).
 *
 * V repu jsou jen veřejné hodnoty (site key, příjemce mailu). Secrety
 * hledá contact.php v override souborech ve dvou cestách:
 *
 *   1) `config.local.php` vedle tohoto souboru – pro lokální vývoj.
 *      Soubor je v `.gitignore`. Po `make build` ho integrace
 *      `strip-local-php-config` smaže z `dist/`, takže se nikdy
 *      nedostane do deploy streamu.
 *
 *   2) `redome-config.php` v `$_SERVER['DOCUMENT_ROOT']` – pro Wedos
 *      hosting. Žije mimo `subdom/<branch>/`, takže ho atomic swap
 *      deploye nezmaže.
 *
 * Struktura array je připravená na budoucí migraci na Nette NEON
 * (`nette/neon` parser vrací stejný formát – stačí přejmenovat soubor
 * a změnit `require` za `Neon::decodeFile`).
 *
 * @return array{
 *   hcaptcha: array{site_key: string, secret: ?string},
 *   mail: array{to: string},
 * }
 */
return [
    'hcaptcha' => [
        // Site key je veřejný – stejnou hodnotu vystavujeme i ve frontendu
        // (src/lib/site.ts). Pozor: musí matchovat, jinak siteverify vrátí
        // "sitekey-secret-mismatch".
        'site_key' => 'cb2063a0-9696-4074-afce-f292e2d80b68',
        // Secret přepiš v `config.local.php` (lokál) nebo `redome-config.php`
        // (Wedos). Bez něj contact.php vrátí 500 (fail-closed).
        'secret'   => null,
    ],
    'mail' => [
        'to' => 'redome@redome.cz',
    ],
];
