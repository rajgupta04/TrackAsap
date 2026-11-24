# Base TrackAsap host configuration: system user, directories, and core utilities
class trackasap (
  String $app_dir = lookup('trackasap::app_dir', String, 'first', '/opt/trackasap'),
) {
  $base_packages = ['git', 'curl', 'jq', 'htop', 'ufw', 'ca-certificates']

  package { $base_packages:
    ensure => installed,
  }

  group { 'trackasap':
    ensure => present,
  }

  user { 'trackasap':
    ensure     => present,
    gid        => 'trackasap',
    home       => $app_dir,
    shell      => '/bin/bash',
    managehome => true,
    require    => Group['trackasap'],
  }

  file { [$app_dir, "${app_dir}/logs", "${app_dir}/backups"]:
    ensure  => directory,
    owner   => 'trackasap',
    group   => 'trackasap',
    mode    => '0755',
    require => User['trackasap'],
  }
}
