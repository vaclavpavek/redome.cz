# PHP image pro vývoj kontaktního formuláře a jiných lehkých endpointů.
# Funkce mail() je přesměrovaná přes msmtp na službu `mailpit`,
# která v UI ukáže každou odeslanou zprávu (žádné skutečné odesílání).

FROM php:8.3-cli-alpine

RUN apk add --no-cache msmtp

# Necháme msmtp posílat výchozí účet (mailpit) – PHP volá `mail()`,
# msmtp se postará o doručení do schránky mailpit.
COPY <<'EOF' /etc/msmtprc
defaults
auth        off
tls         off
logfile     /tmp/msmtp.log

account     mailpit
host        mailpit
port        1025
from        noreply@redome.cz

account default : mailpit
EOF

RUN chmod 644 /etc/msmtprc

# Sendmail_path předá zprávu do msmtp, který ji pošle do Mailpit
RUN echo "sendmail_path = /usr/bin/msmtp -t -i" > /usr/local/etc/php/conf.d/sendmail.ini

WORKDIR /var/www

EXPOSE 8080
CMD ["php", "-S", "0.0.0.0:8080", "-t", "/var/www"]
