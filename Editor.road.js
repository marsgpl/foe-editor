// road ext

Editor.road = { w:10, h:10 };
Editor.road.list = [];
Editor.road.type = false;

Editor.road.create = function( road_type ) {
	if ( !Editor.road.add() ) return;
	Editor.road.connect();
	Editor.road.check_conn_b();
	Editor.road.draw();
	
	Editor.road.type = road_type;
	Editor.calc_statistic();
};

Editor.road.fill_m4 = function() {
	Editor.m4.innerHTML = "";
	
	for ( var type in Editor.roads ) {
		var road = Editor.roads[type];
		var node = d.newNode("div");
		node.id = "b-road-"+type;
		node.innerHTML = road.t;
		Editor.m4.appendChild(node);
	}
	
	Editor.m4.show();
};

Editor.road.draw = function() {
	for ( var i=0; i<Editor.road.list.length; ++i ) {
		var o = Editor.road.list[i];
		var node = d.newNode("div");
		node.className = "broad";
		node.t(o.y).l(o.x).w(o.w).h(o.h);
		node.css({ background:o.conn?"#888":"#F00" });
		Editor.grid.node.appendChild(node);
	}
};

Editor.road.del = function() {
	Editor.road.list = [];
	Editor.road.type = false;
	
	var list = lib.get(".broad");
	
	for ( var i=list.length-1; i>=0; --i ) {
		list[i].rem();
	}
	
	for ( var i=0; i<Editor.grid.buildings_tag_list.length; ++i ) {
		var o = Editor.grid.buildings_tag_list[i].obj;
		if ( o.info.sq ) continue;
		o.conn = false;
	}
	
	Editor.calc_statistic();
};

Editor.road.can_expand = function( top, left ) {
	var insq = false;
	
	for ( var i=0; i<Editor.grid.buildings_tag_list.length; ++i ) {
		var o = Editor.grid.buildings_tag_list[i].obj;
		
		if ( i2d.is_point_in_poly(o.tblr(), top, left) ) {
			if ( o.info.sq ) insq = true;
			else return o.info.is_main;
		}
	}
	
	return insq;
};

Editor.road.is_on_b = function( top, left ) {
	for ( var i=0; i<Editor.grid.buildings_tag_list.length; ++i ) {
		var o = Editor.grid.buildings_tag_list[i].obj;
		if ( o.info.sq ) continue;
		if ( i2d.is_point_in_poly(o.tblr(), top, left) ) return true;
	}
	return false;
};

Editor.road.add = function() {
	var mains = Editor.find_main();
	
	if ( mains.length < 1 ) return Editor.dialog("Ратуша не найдена", 0,0);
	if ( mains.length > 1 ) return Editor.dialog("На схеме более 1 ратуши\nОставьте только одну",0,0);
	
	Editor.road.del();
	
	var x,y,qt,ql,t,l,conn;
	var exp = Editor.road.can_expand;
	
	var w = Editor.road.w;
	var h = Editor.road.h;
	
	var w_step = Math.floor(Editor.grid.cell_w/2 - w/2) + 1;
	var h_step = Math.floor(Editor.grid.cell_h/2 - h/2) + 1;
	
	for ( var i=0; i<Editor.grid.buildings_tag_list.length; ++i ) {
		var o = Editor.grid.buildings_tag_list[i].obj;
		if ( !o.info.sq ) continue;
		
		for ( y=0; y<4; ++y ) {
			for ( x=0; x<4; ++x ) {
				qt = o.i2d_t + y*Editor.grid.cell_h;
				ql = o.i2d_l + x*Editor.grid.cell_w;
				
				t = qt + h_step;
				l = ql + w_step;
				
				if ( Editor.road.is_on_b(t, l) ) continue;
				
				var add_w = 0;
				var add_l = 0;
				
				if ( exp(t, l-Editor.grid.cell_w) ) { add_w++; add_l--; }
				if ( exp(t, l+Editor.grid.cell_w) ) { add_w++; }
				
				Editor.road.list.push({
					t: t,
					b: t + h,
					l: l,
					r: l + w,
					x: l + add_l*w_step,
					y: t,
					w: w + add_w*w_step,
					h: h,
				});
				
				var add_h = 0;
				var add_t = 0;
				
				if ( exp(t-Editor.grid.cell_h, l) ) { add_h++; add_t--; }
				if ( exp(t+Editor.grid.cell_h, l) ) { add_h++; }
				
				Editor.road.list.push({
					t: t,
					b: t + h,
					l: l,
					r: l + w,
					x: l,
					y: t + add_t*h_step,
					w: w,
					h: h + add_h*h_step,
				});
			}
		}
	}
	
	if ( !Editor.road.list.length ) {
		return Editor.dialog("Нет места для дороги\nИспользуйте кнопку \"+кв\"",0,0);
	}
	
	return true;
};

Editor.road.connect = function() {
	var m = Editor.find_main()[0].tblr();
	var good=[],need=[],bad=[];
	
	var sw = Editor.grid.cell_w;
	var sh = Editor.grid.cell_h;
	
	for ( var i=0; i<Editor.road.list.length; ++i ) {
		var o = Editor.road.list[i];
		
		o.conn =
			i2d.intersect(m, { t:o.t, b:o.b, l:o.l-sw, r:o.r+sw }) ||
			i2d.intersect(m, { t:o.t-sh, b:o.b+sh, l:o.l, r:o.r });
		
		if ( o.conn ) need.push(o); else bad.push(o);
	}
	
	var n,b,newb;
	
	while ( need.length > 0 ) {
		newb = [];
		n = need.pop();
		
		for ( var i=0; i<bad.length; ++i ) {
			b = bad[i];
			
			b.conn =
				i2d.intersect(
					{ t:b.t, b:b.b, l:b.l-sw, r:b.r+sw },
					{ t:n.t, b:n.b, l:n.l-sw, r:n.r+sw })
				||
				i2d.intersect(
					{ t:b.t-sh, b:b.b+sh, l:b.l, r:b.r },
					{ t:n.t-sh, b:n.b+sh, l:n.l, r:n.r });
			
			if ( b.conn ) need.push(b);
			else newb.push(b);
		}
		
		good.push(n);
		bad = newb;
	}
};

Editor.road.check_conn_b = function() {
	var r,b; // road, building
	
	var sw = Editor.grid.cell_w;
	var sh = Editor.grid.cell_h;
	
	for ( var ri=0; ri<Editor.road.list.length; ++ri ) {
		r = Editor.road.list[ri];
		if ( !r.conn ) continue;
		
		for ( var bi=0; bi<Editor.grid.buildings_tag_list.length; ++bi ) {
			b = Editor.grid.buildings_tag_list[bi].obj;
			
			if ( b.info.sq || b.conn ) continue;
			
			b.conn = 
				i2d.intersect(b.tblr(), { t:r.t, b:r.b, l:r.l-sw, r:r.r+sw }) ||
				i2d.intersect(b.tblr(), { t:r.t-sh, b:r.b+sh, l:r.l, r:r.r });
		}
	}
	
	for ( var i=0; i<Editor.grid.buildings_tag_list.length; ++i ) {
		var o = Editor.grid.buildings_tag_list[i].obj;
		if ( o.info.sq ) continue;
		
		if ( o.info.is_main ) o.conn = true;
		if ( o.info.is_decor ) o.conn = true;
		
		o.toggle_color(o.conn ? "green" : "red");
		o.toggle_border(o.conn ? "off" : "on");
	}
};
