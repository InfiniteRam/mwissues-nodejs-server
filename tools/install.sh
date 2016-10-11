#!/bin/sh
# Author: Bastien Brunnenstein

if [ ! -e tools/issues-mysql.sql ]; then
  echo 'Make sure you are in the right directory (mwissues-nodejs-server) and try again'
  exit 1
fi

if [ -e VERSION ]; then
  MWVER=$(cat VERSION)
  echo "MwIssues is already installed (version ${MWVER})"

  if [ ${MWVER} = '1.0' ]; then
    echo 'Cannot upgrade automatically to version 1.1'
    exit 1
  fi
  exit 0
fi

# Stop on error
set -e

# Generate MwIssues MySql password
MWPASS=$(tr -cd '[:alnum:]' < /dev/urandom | head -c30)

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
mv -i config.json config.json.old
sed "s%\(\"password\"\)\s*:\s*\".*\"%\1 : \"${MWPASS}\"%" < config.json.old > config.json

# Dump the password on a file outside of version control
echo ${MWPASS} > MYSQLPWD

# Permissions
chmod 0 MYSQLPWD
chmod 600 config.json
chmod +x index.js

# Create root user with root password and admin permissions
tools/create-db-user.js root root A

# Finished base installation
echo 1.0 > VERSION

# Download the packages for NodeJs
echo 'Downloading NPM packages...'
npm update

# Setup the service
chmod +x tools/mwissues-install-service.sh
if [ $(groups | grep -c sudo) -eq 0 ]; then
  echo 'Please run tools/mwissues-install-service.sh with root access'
  echo 'You can also do "nodejs index.js" to start the server manually'
else
  echo 'Your password may be asked in order to install the service'
  sudo tools/mwissues-install-service.sh $(whoami)
fi
