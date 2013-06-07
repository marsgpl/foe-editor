// city editor

var Editor = {};

Editor.scheme = "";
Editor.save_slot_pref = "Editor-save-";

Editor.last_built_info = false; // пробел - повторить эту постройку
Editor.last_md_action = false; // последнее действие мышью

Editor.mouse_x = 0;
Editor.mouse_y = 0;

Editor.grid = false;

Editor.authors = {
	"SergeA": {
		url: "http://forum.ru.forgeofempires.com/member.php?3447-SergeA",
		role: "Картинки (InnoGames)",
	},
	"Shinigami": {
		url: "http://forum.ru.forgeofempires.com/member.php?2983-Shinigami",
		role: "Параметры строений",
	},
	"airevent": {
		url: "http://forum.ru.forgeofempires.com/member.php?3155-airevent",
		role: "Остальное",
	},
};

Editor.calc_statistic = function() {
	var pop_add = 0;
	var pop_rem = 0;
	var hap_add = 0;
	var kpd = "-";

	// buildings
	for ( var i=0; i<Editor.grid.buildings_tag_list.length; ++i ) {
		var o = Editor.grid.buildings_tag_list[i].obj;

		if ( o.info.p ) { // population
			if ( o.info.p > 0 ) pop_add += o.info.p;
			else                pop_rem += o.info.p;
		}

		if ( o.info.ha ) { // happiness
			hap_add += o.info.ha;
		}
	}

	// road
	if ( Editor.road.type ) {
		hap_add += Editor.road.list.length/2 * Editor.roads[Editor.road.type].ha;
	}

	if ( pop_add==0 ) {
		kpd = "-";
	} else if ( hap_add >= pop_add*1.4 ) {
		kpd = "120%";
	} else if ( hap_add <= pop_add ) {
		kpd = "50%";
	} else {
		kpd = "100%";
	}

	var pop_free = pop_add + pop_rem;
	var hap_to   = Math.ceil(pop_add*1.4 - hap_add);

	lib.get("#stat-pop-free").innerHTML = pop_free; // Жителей свободно
	lib.get("#stat-hap-to").innerHTML = hap_to; // Счастья до восторга
	lib.get("#stat-kpd").innerHTML = kpd; // Производительность
};

Editor.prepare_buildings = function() {
	for ( var parent_type in Editor.buildings ) {
		var parent = Editor.buildings[parent_type];

		parent.t = parent.t || parent_type;
		parent.type = parent_type;
		parent.is_main = parent_type == "main";
		parent.is_decor = (parent_type == "1x1" || parent.d);
		parent.is_gb = parent_type == "GB";

		if ( parent.ch ) {
			for ( var child_type in parent.ch ) {
				var child = parent.ch[child_type];

				child.t = child.t || parent.t + " (без типа)";
				child.type = child_type;
				child.is_main = parent.is_main;
				child.is_decor = (parent.is_decor || child.d);

				child.parent = parent;
				child.parent_type = parent_type;

				child.w = child.w?child.w:parent.w;
				child.h = child.h?child.h:parent.h;
			}
		}
	}
};

Editor.onload = function() {
	w.oncontextmenu = lib.antievent;
	lib.noselect(d.body);

	//Editor.m1 = lib.get("#panel-m1");
	Editor.m2 = lib.get("#panel-m2");
	//Editor.m3 = lib.get("#panel-m3");
	Editor.m4 = lib.get("#panel-m4");

	Editor.prepare_buildings();

	Editor.grid = new i2d.grid({
		node: lib.get("#grid"),
		img_node: lib.get("#grid-img"),
		drag_node: lib.get("#grid-drag"),
		t: -200,
		l: 200,
		w: 40,
		h: 40,
	});

	lib.bind(w, "mousedown", Editor.on_m_down);
	lib.bind(w, "mousemove", Editor.on_m_move);
	lib.bind(w, "mouseup",   Editor.on_m_up);
	lib.bind(w, "keydown",   Editor.on_k_down);

	var scheme = ".k|4.g|4.c|4.o|4.o|8.k|8.g|8.c|8.c|c.g|c.k|c.o|c.o|g.g|g.c|g.k|g";
	Editor.load_scheme(scheme);
};

Editor.build_by_info = function( info, x, y ) {
	if ( !info ) return;

	if ( info.is_main && Editor.find_main().length>0 ) {
		return Editor.dialog("На схеме уже присутствует ратуша", 270,0);
	}

	Editor.last_built_info = info;

	var building = new i2d.building({
		grid: Editor.grid,
		info: info,
		t: y - Editor.grid.img_t,
		l: x - Editor.grid.img_l,
	});

	Editor.grid.start_move_building(building, x, y);

	Editor.m2.hide();
	Editor.m4.hide();
};

Editor.dialog = function( text, w, h ) {
	lib.ask.show({
		"text": text,
		"w": w ? w : 250,
		"h": h ? h : 150,
		"buttons": [
			{ "label":"Закрыть", "cb":lib.ask.hide },
		],
	});
};

Editor.find_main = function() {
	Editor.grid.refresh_buildings_tag_list();

	var found = [];

	for ( var i=0; i<Editor.grid.buildings_tag_list.length; ++i ) {
		var o = Editor.grid.buildings_tag_list[i].obj;
		if ( o.info.is_main ) found.push(o);
	}

	return found;
};

Editor.show_authors = function() {
	var html = "";

	html += "<div id='authors'>";

	for ( var name in Editor.authors ) {
		var o = Editor.authors[name];
		html += "<div>"+o.role+": <a href='"+o.url+"' target='_blank'>"+name+"</a></div>";
	}

	html += "</div>";

	lib.ask.show({
		"html": html,
		"w": 250,
		"h": 150,
		"buttons": [
			{ "label":"Закрыть", "cb":lib.ask.hide },
		],
	});
};

Editor.repeat_last_build = function() {
	if ( Editor.grid.moving ) return;
	if ( Editor.grid.bui_moving ) return;
	if ( !Editor.last_built_info ) return;

	Editor.build_by_info(Editor.last_built_info, Editor.mouse_x, Editor.mouse_y);
};

Editor.fill_m2_panel = function( parent ) {
	Editor.m2.innerHTML = "";

	for ( var child_type in parent.ch ) {
		var child = parent.ch[child_type];
		var node = d.newNode("div");
		node.id = "b-"+child.parent_type+"-"+child_type;
		node.innerHTML = child.t;
		Editor.m2.appendChild(node);
	}

	Editor.m2.show();
};

Editor.get_building_by_type = function( type ) {
	var info = Editor.buildings[type];
	if ( info ) return info;

	var pos = type.indexOf("-");
	var parent_type = type.substr(0,pos);
	var child_type = type.substr(pos+1);

	info = Editor.buildings[parent_type];
	if ( info && info.ch ) return info.ch[child_type];

	return null;
};

Editor.get_type_by_code = function( code ) {
	var c1 = code.substr(0,1);

	for ( var t in Editor.buildings ) {
		var info = Editor.buildings[t];
		if ( info.c == c1 ) { c1 = t; break; }
	}

	if ( code.length ==1 ) return c1;
	else                   return c1+"-"+code.substr(1);
};

Editor.on_b_button = function( e ) {
	//if ( Editor.grid.moving ) return;
	if ( Editor.grid.bui_moving ) return;

	Editor.m2.hide();
	Editor.m4.hide();

	var type = e.target.id.substr(2); // building type
	var info = Editor.get_building_by_type(type); // building info

	if ( !info ) {
		if ( type.substr(0,5)=="road-" ) {
			Editor.road.create(type.substr(5));
			return;
		}

		switch ( type ) {
			case "road": Editor.road.fill_m4(); break;
			case "rot":  Editor.grid.rotate(); break;
			case "save": Editor.save(); break;
			case "load": Editor.load(); break;
		}
		return;
	}

	if ( info.ch ) {
		Editor.fill_m2_panel(info);
	} else {
		Editor.build_by_info(info, e.pageX, e.pageY);
	}
};

Editor.is_b_button = function( e ) {
	return e.target.id.substr(0,2)=="b-";
};

Editor.on_k_down = function( e ) {
	if ( lib.ask.opened ) return;

	var key = lib.getKey(e);

	switch ( key ) {
		case 32: // space
			lib.antievent(e);
			Editor.repeat_last_build();
			break;
		case 46: // del
			lib.antievent(e);
			Editor.grid.delete_building_by_key(e);
			break;
		case 121: // F10
			lib.antievent(e);
			Editor.show_authors();
			break;
	}
};

Editor.on_m_move = function( e ) {
	if ( lib.ask.opened ) return;

	Editor.mouse_x = e.pageX;
	Editor.mouse_y = e.pageY;

	if ( Editor.grid.moving ) {
		Editor.grid.exec_move(e);
	} else if ( Editor.grid.bui_moving ) {
		Editor.grid.exec_move_building(e);
	}

	Editor.noevent_except_form(e);
};

Editor.on_m_down = function( e ) {
	if ( lib.ask.opened ) return;

	Editor.grid.stop_move(e);

	if ( Editor.grid.bui_moving ) { // любой кнопкой разместить здание
		Editor.last_md_action = "b-move";
		Editor.grid.place_building();
	} else if ( e.button ) { // правой кнопкой удалить здание
		Editor.last_md_action = "b-del";
		Editor.grid.delete_building_by_mouse(e);
	} else if ( Editor.is_b_button(e) ) { // клик по меню
		Editor.last_md_action = "b-menu";
		Editor.on_b_button(e);
	} else if ( e.target.id.substr(0,5) != "panel" ) { // переместить сетку
		Editor.last_md_action = "g-move";
		Editor.grid.start_move(e);
	}

	Editor.noevent_except_form(e);
};

Editor.noevent_except_form = function( e ) {
	var tag = e.target.tagName.toLowerCase();
	if ( tag != "textarea" && tag != "input" ) lib.antievent(e);
};

Editor.on_m_up = function( e ) {
	if ( lib.ask.opened ) return;

	Editor.grid.stop_move(e);

	if ( !Editor.grid.moved && Editor.last_md_action!="b-menu" ) {
		Editor.road.del();
		Editor.m2.hide();
		Editor.m4.hide();
	}

	if (!e.button &&
		!Editor.grid.moved &&
		e.target.obj &&
		!e.target.obj.info.sq &&
		Editor.last_md_action!="b-move" &&
		Editor.last_md_action!="b-menu"
	) {
		Editor.grid.start_move_building(e.target.obj, e.pageX, e.pageY);
	}

	Editor.grid.moved = false;
};
