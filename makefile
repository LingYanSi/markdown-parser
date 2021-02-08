release:
	yarn build
	git add .; git commit -m "release: master auto release";
	npm verison patch
