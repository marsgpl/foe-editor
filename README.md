Компиляция javascript файлов:

$ closure \
	--jscomp_off internetExplorerChecks \
	--charset utf-8 \
	--compilation_level ADVANCED_OPTIMIZATIONS \
	--warning_level VERBOSE \
	--js lib.js \
	--js lib.ask.js \
	--js i2d.js \
	--js i2d.grid.js \
	--js i2d.building.js \
	--js Editor.js \
	--js Editor.buildings.js \
	--js Editor.road.js \
	--js Editor.session.js \
	--js index.js \
	--js_output_file all.js

closure - google closure compiler
