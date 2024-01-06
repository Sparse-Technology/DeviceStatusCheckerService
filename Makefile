.PHONY: all clean linux-x64 win-x64 linux-arm64 linux-arm

linux-x64:
	dotnet publish -c Release -r linux-x64 -p:PublishDir=bin/publish_dist/linux-x64/ -p:PublishSingleFile=true --self-contained true
win-x64:
	dotnet publish -c Release -r win-x64 -p:PublishDir=bin/publish_dist/win-x64/ -p:PublishSingleFile=true --self-contained true
linux-arm64:
	dotnet publish -c Release -r linux-arm64 -p:PublishDir=bin/publish_dist/linux-arm64/ -p:PublishSingleFile=true --self-contained true
linux-arm:
	dotnet publish -c Release -r linux-arm -p:PublishDir=bin/publish_dist/linux-arm/ -p:PublishSingleFile=true --self-contained true

all: | linux-x64 win-x64 linux-arm64 linux-arm

dist: | all
ifeq ($(OS), Windows_NT)
#	Windows-specific commands
	@echo "Creating zip file in Windows"
	powershell Compress-Archive -Path bin/publish_dist/* -DestinationPath bin/publish_dist.zip
else
#	Linux commands
	@echo "Creating tar.gz file in Linux"
	cd ./bin/publish_dist/; tar -czvf ../publish_dist.tar.gz *
endif

clean:
ifeq ($(OS), Windows_NT)
#	Windows-specific commands
	if exist bin\ (rmdir /s /q bin) else echo "bin not found, skipping clean"
	if exist obj\ (rmdir /s /q obj) else echo "obj not found, skipping clean"
else
#	Linux commands
	@if [ -d bin ]; then rm -rf bin; else echo "bin not found, skipping clean"; fi
	@if [ -d obj ]; then rm -rf obj; else echo "obj not found, skipping clean"; fi
endif