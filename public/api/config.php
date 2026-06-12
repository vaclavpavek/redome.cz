<?php
defined('REDOME_CONTACT_BOOT') || die('Direct access forbidden');
/**
 * Veřejná konfigurace backendu. `config.local.php` přepíše jen secret.
 * hCaptcha site key musí matchovat frontend (src/lib/site.ts).
 */
return [
    'hcaptcha' => [
        'site_key' => IS_PRODUCTION
            ? 'cb2063a0-9696-4074-afce-f292e2d80b68'
            : 'c3449c18-93ae-4916-bc68-6b76d634046c',
        'secret' => null,
    ],
    'mail' => [
        'to' => 'redome@redome.cz',
    ],
];
