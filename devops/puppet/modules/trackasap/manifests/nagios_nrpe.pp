# Deploys Nagios NRPE agent & custom TrackAsap deep-health probe
class trackasap::nagios_nrpe (
  String        $app_dir       = lookup('trackasap::app_dir', String, 'first', '/opt/trackasap'),
  Integer       $backend_port  = lookup('trackasap::backend_port', Integer, 'first', 5000),
  Integer       $frontend_port = lookup('trackasap::frontend_port', Integer, 'first', 3000),
  Array[String] $allowed_hosts = lookup('trackasap::nagios_allowed_hosts', Array[String], 'first', ['127.0.0.1']),
) {
  package { ['nagios-nrpe-server', 'monitoring-plugins']:
    ensure => installed,
  }

  file { '/usr/lib/nagios/plugins/check_trackasap_health.sh':
    ensure  => file,
    mode    => '0755',
    source  => "${app_dir}/devops/nagios/plugins/check_trackasap_health.sh",
    require => Package['nagios-nrpe-server'],
  }

  file { '/etc/nagios/nrpe.d/trackasap.cfg':
    ensure  => file,
    mode    => '0644',
    content => template('trackasap/nrpe_trackasap.cfg.erb'),
    require => File['/usr/lib/nagios/plugins/check_trackasap_health.sh'],
    notify  => Service['nagios-nrpe-server'],
  }

  service { 'nagios-nrpe-server':
    ensure  => running,
    enable  => true,
    require => Package['nagios-nrpe-server'],
  }
}
