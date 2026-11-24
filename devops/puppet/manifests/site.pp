# Puppet Master Node Classification for TrackAsap Infrastructure

node /^trackasap-app-.*$/ {
  include trackasap
  include trackasap::docker
  include trackasap::nginx
  include trackasap::nagios_nrpe
}

node /^trackasap-ai-.*$/ {
  include trackasap
  include trackasap::docker
  include trackasap::nagios_nrpe
}

node 'default' {
  include trackasap
  include trackasap::docker
  include trackasap::nagios_nrpe
}
