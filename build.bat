"C:\Program Files\7-Zip\7z" a -xr!.svn smartTemplate.zip install.rdf chrome.manifest content defaults locale skin license.txt icon.png 
set /P smartTemplateRev=<revision.txt
set /a smartTemplateRev+=1
echo %smartTemplateRev% > revision.txt
move *.xpi "..\_Test Versions\1.1\"
rename smartTemplate.zip smartTemplate-1.1pre%smartTemplateRev%.xpi