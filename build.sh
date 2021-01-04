#!/bin/bash

smartTemplateRev=$( cat revision.txt | xargs )
oldRev=$smartTemplateRev
smartTemplateRev=$((smartTemplateRev+1))

sed -i "s/pre$oldRev/pre$smartTemplateRev/g" manifest.json

7z a -xr!.svn smartTemplateWeb.zip manifest.json _locales chrome locale popup st-background.js license.txt icon.png release-notes.html

echo $smartTemplateRev > revision.txt
mv smartTemplate-*.xpi "../../../Test Versions/3.3/"
mv smartTemplateWeb.zip smartTemplate-fx-3.3.1pre$smartTemplateRev.xpi
