# Manages host-level Nginx reverse proxy & TLS termination for TrackAsap
class trackasap::nginx (
  Integer $backend_port  = lookup('trackasap::backend_port', Integer, 'first', 5000),
  Integer $frontend_port = lookup('trackasap::frontend_port', Integer, 'first', 3000),
) {
  package { 'nginx':
    ensure => installed,
  }

  service { 'nginx':
    ensure  => running,
    enable  => true,
    require => Package['nginx'],
  }

  file { '/etc/nginx/sites-available/trackasap.conf':
    ensure  => file,
    mode    => '0644',
    content => @("NGINX")
      server {
        listen 80;
        server_name trackasap.in www.trackasap.in;

        location /api/ {
          proxy_pass http://127.0.0.1:${backend_port};
          proxy_http_version 1.1;
          proxy_set_header Upgrade \$http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_set_header Host \$host;
          proxy_set_header X-Real-IP \$remote_addr;
          proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        }

        location /metrics {
          allow 127.0.0.1;
          allow 10.0.2.0/24;
          deny all;
          proxy_pass http://127.0.0.1:${backend_port}/metrics;
        }

        location / {
          proxy_pass http://127.0.0.1:${frontend_port};
          proxy_set_header Host \$host;
          proxy_set_header X-Real-IP \$remote_addr;
        }
      }
      | NGINX
    ,
    require => Package['nginx'],
    notify  => Service['nginx'],
  }

  file { '/etc/nginx/sites-enabled/trackasap.conf':
    ensure  => link,
    target  => '/etc/nginx/sites-available/trackasap.conf',
    require => File['/etc/nginx/sites-available/trackasap.conf'],
    notify  => Service['nginx'],
  }
}
