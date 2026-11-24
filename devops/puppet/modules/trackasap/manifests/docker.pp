# Enforces Docker daemon logging limits and service availability
class trackasap::docker (
  String $log_max_size = lookup('trackasap::docker_log_max_size', String, 'first', '50m'),
  String $log_max_file = lookup('trackasap::docker_log_max_file', String, 'first', '3'),
) {
  package { 'docker.io':
    ensure => installed,
  }

  file { '/etc/docker':
    ensure => directory,
    mode   => '0755',
  }

  file { '/etc/docker/daemon.json':
    ensure  => file,
    mode    => '0644',
    content => template('trackasap/daemon.json.erb'),
    require => File['/etc/docker'],
    notify  => Service['docker'],
  }

  service { 'docker':
    ensure  => running,
    enable  => true,
    require => Package['docker.io'],
  }
}
