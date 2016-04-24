#!/bin/sh
# Author: Bastien Brunnenstein

if [ ! -e tools/issues-mysql.sql ]; then
  echo 'Make sure you are in the right directory (mwissues-nodejs-server) and try again'
  return 1
fi;

# Generate MwIssues MySql password
MWPASS=`tr -cd '[:alnum:]' < /dev/urandom | head -c30`

# Prepare the database
echo 'Please enter your MySql password...'
mysql --user=root --password << EOF
  create database mwissues;
  create user 'mwissues'@'localhost' identified by '${MWPASS}';
  grant all on mwissues.* to 'mwissues'@'localhost';
  use mwissues;
  source tools/issues-mysql.sql;
EOF

# Update config.json with the MySql password
mv config.json config.json.old
sed "s%\(\"password\"\)\s*:\s*\".*\"%\1 : \"${MWPASS}\"%" < config.json.old > config.json

# Permissions
chmod 600 config.json
chmod +x index.js

# Download the packages for NodeJs
echo 'Downloading NPM packages...'
npm update

# Setup the service
chmod +x tools/mwissues-install-service.sh
sudo tools/mwissues-install-service.sh `whoami`
