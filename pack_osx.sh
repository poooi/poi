#!/bin/bash

change_icon () {
    FILENAME=$1
    IMAGEPATH=$2
    TMP_RSRC_PATH=$TMP_DIR/tmpicns.rsrc
    sips -i "$IMAGEPATH"
    DeRez -only icns "$IMAGEPATH" > "$TMP_RSRC_PATH"
    Rez -append "$TMP_RSRC_PATH" -o "$FILENAME"
    SetFile -a C "$FILENAME"
}

set_infostr () {
    psutil -replace "$1" -string "$2" "${INFO_PLIST}"
}

POI_VERSION=$1
RAW_APP_PATH=$2
TMP_DIR=$3
RESOURCES_PATH=$4

# Update info.plist to poi
APP_ROOT="${RAW_APP_PATH}/Contents"
INFO_PLIST="${APP_ROOT}/Info.plist"
set_infostr	CFBundleName			Poi
set_infostr	CFBundleDisplayName		Poi
set_infostr	CFBundleIdentifier		com.github.poi
set_infostr	CFBundleVersion			"${POI_VERSION}"
set_infostr	CFBundleShortVersionString	"${POI_VERSION}"

# Executable
set_infostr	CFBundleExecutable          	Poi
mv "${APP_ROOT}"/MacOS/{Electron,Poi}

# Icon
set_infostr	CFBundleIconFile		poi.icns
mv "${APP_ROOT}"/Resources/{atom,poi}.icns
if [[ -f ${RESOURCES_PATH}/poi.icns ]]; then
    cp "${RESOURCES_PATH}/poi.icns" "${APP_ROOT}/Resources/poi.icns"
fi

# Create .dmg
mkdir -p "$TMP_DIR"
RAW_APP_NAME=$(basename "$RAW_APP_PATH")
DMG_PATH="${TMP_DIR}/Poi-v${POI_VERSION}-osx-x64.dmg"
hdiutil create -format UDRW -srcfolder "$RAW_APP_PATH" "$DMG_PATH"
# Get the 2nd line of output, the information of the mounted disk
DEVINFO=$(hdiutil attach "$DMG_PATH" -mountrandom "$TMP_DIR" | sed -n 2p)
# e.g. '/dev/disk2s1' ... '/Users/[...]/tmp/dmg.RlxCUx' ...
read -r DEVNAME trash DISKPATH garbage <<< "$DEVINFO"
DISKNAME=$(basename "$DISKPATH")               # e.g. 'dmg.RlxCUx'

pushd "$DISKPATH" >/dev/null
ln -s /Applications .
popd >/dev/null

osascript <<EOF
on delay duration
  set endTime to (current date) + duration
  repeat while (current date) is less than endTime
    tell AppleScript to delay endTime - (current date)
  end repeat
end delay
tell application "Finder"
 tell disk "$DISKNAME"
       open
       delay 1
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

hdiutil detach "$DEVNAME"
hdiutil convert "$DMG_PATH" -format UDBZ -ov -o "$DMG_PATH"

change_icon "$DMG_PATH" "${RESOURCES_PATH}/poi.png"

printf '%s\n' "$DMG_PATH"
