# Create Ubuntu Linux 18, PHP 7.4, Apache image.

# Get the base.
FROM ubuntu:18.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Detroit

# Set active user.
USER root

# Install packages
RUN \
	echo "" && \
	# Set timezone.
	#timedatectl set-timezone 'America/Detroit' && \
	# Update
	apt-get update && \
	echo "" && \
	# Install curl and apt-utils and locales
	apt-get -y --no-install-recommends install apt-utils         && \
	apt-get -y --no-install-recommends install locales curl wget && \
	echo "" && \
	# Set some environment variables and locale.
	locale-gen en_US.UTF-8      && \
	dpkg-reconfigure locales    && \
	export LANGUAGE=en_US.UTF-8 && \
	export LANG=en_US.UTF-8     && \
	export LC_ALL=en_US.UTF-8   && \
	echo "" && \
	# Set timezone
	echo "America/Detroit" > /etc/timezone && \
	echo "" && \
	# Install
	apt-get -y --no-install-recommends install apt-utils && \
	echo "" && \
	# Install
	apt-get -y --no-install-recommends install       \
		software-properties-common                   \
		gcc-avr binutils-avr avr-libc                \
		zip unzip                                    \
		sqlite3                                      \
		wget                                         \
		nano                                         \
		apt-transport-https                          \
		ca-certificates                              \
		curl                                         \
		apache2                                      \
		apache2-utils                                \
		php7.2                                       \
		php-curl php-json php-dom php-pear php-fpm   \
		php-dev php-json php-zip php-curl php-xmlrpc \
		php-gd php-mysql php-mbstring php-xml        \
		php-dom libapache2-mod-php                   \
		php7.2-sqlite                                \
		libapache2-mod-php7.2                        \
		&& \
	echo "" && \
	# Upgrade software.
	#apt-get upgrade -y  && \
	echo "" && \
	# Configure Apache.
	a2enmod php7.2      && \
	a2enmod rewrite     && \
	a2dismod mpm_event  && \
	a2enmod mpm_prefork && \
    echo "" && \
	# Clean up caching and unneeded packages.
	apt-get -y --purge autoremove gcc     && \
	apt-get -y autoclean                  && \
	apt-get -y autoremove                 && \
	rm -rf /var/lib/apt/lists/*           && \
	rm -rf /var/lib/{apt,dpkg,cache,log}/ && \
	echo " "

# Create the MOUNT directory
RUN \
	mkdir /var/www/site       && \
	mkdir /var/www/site/MOUNT && \
	echo ""                   && \
	echo DONE                 && \
	echo ""

# Update the default apache site with the config we created.
ADD apache-config.conf /etc/apache2/sites-enabled/000-default.conf

# Add the redirector file.
ADD index_redirector.php          /var/www/site/index.php

# By default start up apache in the foreground, override with /bin/bash for interative.
CMD /usr/sbin/apache2ctl -D FOREGROUND