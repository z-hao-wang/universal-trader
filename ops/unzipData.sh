zip -s 0 ./data/data.zip --out ./data/data-merged.zip
unzip ./data/data-merged.zip -d ./data/
rm ./data/data-merged.zip
