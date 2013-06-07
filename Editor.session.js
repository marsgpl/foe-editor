// save, load functions

Editor.get_scheme = function() {
	var scheme = [];
	
	for ( var i=0; i<Editor.grid.buildings_tag_list.length; ++i ) {
		var o = Editor.grid.buildings_tag_list[i].obj;
		
		var x = Math.abs(o.i2d_l / Editor.grid.cell_w).toString(36);
		var y = Math.abs(o.i2d_t / Editor.grid.cell_h).toString(36);
		
		var t = o.info.parent ? o.info.parent.c+o.info.type : o.info.c;
		
		scheme.push(t+x+"|"+y);
		if ( (i+1)%8==0 ) scheme.push("\n");
	}
	
	Editor.scheme = scheme.join("");
	return Editor.scheme;
};

Editor.check_local_storage = function() {
	if ( !w.localStorage ) {
		var url = "http://ru.wikipedia.org/wiki/Web_Storage";
		Editor.dialog(
			"<b class='red'>Не сохранено</b>\n\nваш браузер устарел\n"+
			"(требуется <a href='"+url+"' target='_blank'>localStorage</a>)",
		0,0);
		return false;
	} else {
		return true;
	}
};

Editor.save = function() {
	if ( !Editor.check_local_storage() ) return;
	
	var date = (new Date()).toUTCString();
	var scheme = Editor.get_scheme();
	var slot = Editor.save_slot_pref+date;
	
	if ( scheme=="" ) {
		return Editor.dialog("<b class='red'>Не сохранено</b>\n\nсхема пуста",0,0);
	}
	
	w.localStorage[slot] = scheme;
	
	Editor.dialog("Сохранено",0,0);
};

Editor.clean_scheme = function() {
	Editor.grid.clean();
	Editor.road.del();
};

Editor.load_scheme = function( scheme ) {
	Editor.clean_scheme();
	
	scheme = scheme.replace(/\s+/g, "");
	
	var codes = scheme.match(/[^0-9a-z\|]+/g);
	var coords = scheme.split(/[^0-9a-z\|]+/);
	
	if ( !codes || !coords ) return;
	
	while ( !codes[0] ) codes.shift();
	while ( !coords[0] ) coords.shift();
	
	for ( var icode=0, icoord=0; icode<codes.length && icoord<coords.length; ++icode, ++icoord ) {
		var code = codes[icode];
		var xy = coords[icoord];
		
		xy = xy.split("|");
		
		var type = Editor.get_type_by_code(code);
		var info = Editor.get_building_by_type(type);
		
		if ( !info ) continue;
		
		var x = parseInt(xy[0], 36);
		var y = parseInt(xy[1], 36);
		
		var building = new i2d.building({ grid:Editor.grid, info:info, t:0, l:0 });
		building.set_direct_pos(x, y);
	}
	
	Editor.last_built_info = false;
};

Editor.load = function() {
	if ( !Editor.check_local_storage() ) return;
	
	var is_slot = function( slot_name ) {
		return slot_name.substr(0, Editor.save_slot_pref.length)==Editor.save_slot_pref;
	};
	
	var del_this = function( slot ) {
		delete w.localStorage[slot];
		
		lib.ask.show({
			"text": "Слот удалён",
			"w":250, "h":150,
			"buttons": [
				{ "label":"Назад", "cb":Editor.load },
			],
		});
	};
	
	/** @this {Object} */
	var slot_action = function( e ) {
		var slot = this["slot"];
		
		var scheme = w.localStorage[slot];
		var name = slot.substr(Editor.save_slot_pref.length);
		
		if ( e.target.action_del ) {
			lib.ask.show({
				"text": "<b>"+name+"</b>\nУдалить этот слот?",
				"w":250, "h":150,
				"buttons": [
					{ "label":"<b class='red'>Да</b>", "cb":function(){del_this(slot);} },
					{ "label":"Не", "cb":Editor.load },
				],
			});
		} else if ( e.target.action_export ) {
			lib.ask.show({
				"text": "Выделите и скопируйте этот код (ctrl+C)<br>"+
					"<textarea class='scheme-text'>"+scheme.replace(/\n/g,"")+"</textarea>",
				"w":400, "h":300,
				"buttons": [
					{ "label":"Назад", "cb":Editor.load },
				],
			});
		} else {
			lib.ask.hide();
			Editor.load_scheme(scheme);
		}
	};
	
	var fill = function() {
		var parent = lib.get("#load-menu");
		
		for ( var slot in w.localStorage ) {
			if ( !is_slot(slot) ) continue;
			
			var scheme = w.localStorage[slot];
			var name = slot.substr(Editor.save_slot_pref.length);
			
			var action_node;
			
			var node = d.newNode("div");
			node.id = slot;
			node.innerHTML = name;
			parent.appendChild(node);
			
			action_node = d.newNode("span");
			action_node.innerHTML = "удалить";
			action_node.action_del = true;
			node.appendChild(action_node);
			
			action_node = d.newNode("span");
			action_node.innerHTML = "экспорт";
			action_node.action_export = true;
			node.appendChild(action_node);
			
			lib.bind(node, "mousedown", slot_action, { "slot":slot });
		}
	};
	
	var del_all = function() {
		for ( var slot in w.localStorage ) {
			if ( !is_slot(slot) ) continue;
			delete w.localStorage[slot];
		}
		
		lib.ask.show({
			"text": "Все слоты удалены",
			"w":250, "h":150,
			"buttons": [
				{ "label":"Назад", "cb":Editor.load },
			],
		});
	};
	
	var del_all_ask = function() {
		lib.ask.show({
			"text": "И вы уверены?",
			"w":250, "h":150,
			"buttons": [
				{ "label":"<b class='red'>Да</b>", "cb":del_all },
				{ "label":"Да нет наверное", "cb":Editor.load },
			],
		});
	};
	
	var accept_code = function() {
		var field = lib.get(".scheme-text")[0];
		var code = field.value || field.innerHTML;
		lib.ask.hide();
		Editor.load_scheme(code);
	};
	
	var load_from_text = function() {
		lib.ask.show({
			"text": "Вставьте код города (ctrl+V)<br>"+
					"<textarea class='scheme-text'></textarea>",
			"w":400, "h":300,
			"buttons": [
				{ "label":"Применить", "cb":accept_code },
				{ "label":"Назад", "cb":Editor.load },
			],
			"cb": function(){setTimeout(function(){
				var field = lib.get(".scheme-text")[0];
				field.focus();
			},100);},
		});
	};
	
	lib.ask.show({
		"html": "<div id='load-menu-title'>Нажмите на слот для загрузки:</div>"+
				"<div id='load-menu'></div>",
		"w": 400,
		"h": 300,
		"buttons": [
			{ "label":"Закрыть", "cb":lib.ask.hide },
			{ "label":"Загрузить код", "cb":load_from_text },
			{ "label":"Удалить всё", "cb":del_all_ask },
		],
		"cb": fill,
	});
};
