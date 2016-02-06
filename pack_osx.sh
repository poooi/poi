#!/bin/bash

change_icon () {
    FILENAME=$1
    IMAGEPATH=$2
    TMP_DIR=$3
    TMP_RSRC_PATH=$TMP_DIR/tmpicns.rsrc
    sips -i $IMAGEPATH
    DeRez -only icns $IMAGEPATH > $TMP_RSRC_PATH
    Rez -append $TMP_RSRC_PATH -o $FILENAME
    SetFile -a C $FILENAME
}

POI_VERSION=$1          ;shift
RAW_APP_PATH=$1         ;shift
TMP_DIR=$1              ;shift
RESOURCES_PATH=$1       ;shift

# Update info.plist to poi
APP_ROOT="${RAW_APP_PATH}/Contents"
INFO_PLIST="${APP_ROOT}/Info.plist"
plutil -replace CFBundleName -string Poi ${INFO_PLIST}
plutil -replace CFBundleDisplayName -string Poi ${INFO_PLIST}
plutil -replace CFBundleIdentifier -string com.github.poi ${INFO_PLIST}
plutil -replace CFBundleVersion -string ${POI_VERSION} ${INFO_PLIST}
plutil -replace CFBundleShortVersionString -string ${POI_VERSION} ${INFO_PLIST}

# Executable
plutil -replace CFBundleExecutable -string Poi ${INFO_PLIST}
mv ${APP_ROOT}/MacOS/Electron ${APP_ROOT}/MacOS/Poi

# Icon
plutil -replace CFBundleIconFile -string poi.icns ${INFO_PLIST}
mv ${APP_ROOT}/Resources/atom.icns ${APP_ROOT}/Resources/poi.icns
[[ -f ${RESOURCES_PATH}/poi.icns ]] && cp ${RESOURCES_PATH}/poi.icns ${APP_ROOT}/Resources/poi.icns

# Create .dmg
mkdir -p $TMP_DIR
RAW_APP_NAME=`basename $RAW_APP_PATH`
DMG_PATH="${TMP_DIR}/Poi-v${POI_VERSION}-osx-x64.dmg"
hdiutil create -format UDRW -srcfolder $RAW_APP_PATH $DMG_PATH
# Get the 2nd line of output, the information of the mounted disk
DEVINFO=`hdiutil attach $DMG_PATH -mountrandom $TMP_DIR | sed -n 2p`
DEVNAME=`echo $DEVINFO | awk '{print $1}'`  # e.g. '/dev/disk2s1'
DISKPATH=`echo $DEVINFO | awk '{print $3}'` # e.g. '/Users/[...]/tmp/dmg.RlxCUx'
DISKNAME=`basename $DISKPATH`               # e.g. 'dmg.RlxCUx'

pushd $DISKPATH >/dev/zero
ln -s /Applications
popd >/dev/zero

osascript <<EOF
tell application "Finder"
 tell disk "$DISKNAME"
       open
       set current view of container window to icon view
       set toolbar visible of container window to false
       set statusbar visible of container window to false
       set the bounds of container window to {400, 100, 1000, 500}
       set viewOptions to the icon view options of container window
       set arrangement of viewOptions to not arranged
       set icon size of viewOptions to 150
       set position of item "$RAW_APP_NAME" of container window to {200, 170}
       set position of item "Applications" of container window to {450, 170}
       close
 end tell
end tell
EOF

# Copy DS_Store from Asepsis
#pushd /Volumes/Poi >/dev/zero
#Asepsis_DS_Store='/usr/local/.dscage/Volumes/Poi/_DS_Store'
#[[ -f ${Asepsis_DS_Store} ]] && cp ${Asepsis_DS_Store} .DS_Store
#popd >/dev/zero

hdiutil detach $DEVNAME
hdiutil convert $DMG_PATH -format UDBZ -ov -o $DMG_PATH

change_icon $DMG_PATH ${RESOURCES_PATH}/poi.png $TMP_DIR

echo $DMG_PATH
