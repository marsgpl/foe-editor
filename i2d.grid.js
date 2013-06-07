// i2d grid class
(function() {

/** @constructor */
i2d.grid = function( conf ) {
	this.buildings_tag_list = [];
	
	this.bui_moving = false; // здание перемещается?
	this.moving = false; // сетка перемещается?
	this.moved = false; // сетка перемещена?
	this.in_iso = true; // false = 2d, true = 3d (isometric)
	
	this.cell_w = 33;
	this.cell_h = 33;
	
	this.transition_timeout = 1000;
	
	for ( var key in conf ) {
		this[key] = conf[key];
	}
	
	this.init();
	
	this.img_node.innerHTML = "";
};

var p = i2d.grid.prototype;

/** @this {Object} */
p.init = function() {
	this.set_size();
	this.set_position(this.t, this.l);
};

/** @this {Object} */
p.clean = function() {
	this.node.innerHTML = "";
	this.img_node.innerHTML = "";
	this.drag_node.innerHTML = "";
	this.refresh_buildings_tag_list();
};

/** @this {Object} */
p.rotate = function() {
	if ( this.rotate.mutex ) return;
	this.rotate.mutex = true;
	
	this.in_iso = !this.in_iso;
	
	if ( !this.in_iso ) { // rotate to 2d
		this.node.className = "i2d-grid";
		this.drag_node.className = "i2d-grid-drag";
	} else {
		this.node.className = "i2d i2d-grid";
		this.drag_node.className = "i2d i2d-grid-drag";
	}
	
	this.sort_z_images();
	
	var self = this;
	var change_buildings = function() {
		for ( var i=0; i<Editor.grid.buildings_tag_list.length; ++i ) {
			var o = Editor.grid.buildings_tag_list[i].obj;
			
			o.toggle_img(true);
			o.toggle_border(self.in_iso ? "off" : "on");
		}
		
		self.rotate.mutex = false;
	};
	
	this.in_iso ? setTimeout(change_buildings, this.transition_timeout) : change_buildings();
};
p.rotate.mutex = false;

/** @this {Object} */
p.refresh_buildings_tag_list = function() {
	this.buildings_tag_list = lib.get(".i2d-obj");
	Editor.calc_statistic();
};

/** @this {Object} */
p.set_size = function() {
	this.full_w = this.w * this.cell_w;
	this.full_h = this.h * this.cell_h;
	
	var m = i2d.translate.exec(this.t, this.l, this.full_w, this.full_h);
	
	this.img_full_w = m.w;
	this.img_full_h = m.h;
	
	// cell geometry after transform (related to i2d-grid-img)
	this.cell_w_SR = m.w / this.w / 2;
	this.cell_h_SR = m.h / this.h / 2;
	
	this.node.w(this.full_w-1).h(this.full_h-1);
	this.img_node.w(this.img_full_w+1).h(this.img_full_h+1);
	this.drag_node.w(this.full_w+1).h(this.full_h+1);
};

/** @this {Object} */
p.set_position = function( t, l ) {
	var m = i2d.translate.exec(t, l, this.full_w, this.full_h);
	
	this.t = t;
	this.l = l;
	this.img_t = m.t;
	this.img_l = m.l;
	
	this.node.t(this.t).l(this.l);
	this.img_node.t(this.img_t).l(this.img_l);
	this.drag_node.t(this.t).l(this.l);
};

/** @this {Object} */
p.start_move = function( e ) {
	this.moved = false;
	this.moving = true;
	this.move_info = { x:e.pageX, y:e.pageY, t:this.t, l:this.l };
};

/** @this {Object} */
p.start_move_building = function( building, x, y ) {
	this.bui_moving = true;
	this.bui_move_info = { obj:building };
	building.toggle_border("on");
	building.toggle_drag("off");
};

/** @this {Object} */
p.stop_move = function( e ) {
	this.moving = false;
};

/** @this {Object} */
p.exec_move = function( e ) {
	this.moved = true;
	
	var x = e.pageX;
	var y = e.pageY;
	
	var t = this.move_info.t + ( y - this.move_info.y );
	var l = this.move_info.l + ( x - this.move_info.x );
	
	this.set_position(t, l);
};

/** @this {Object} */
p.exec_move_building = function( e ) {
	var x = e.pageX;
	var y = e.pageY;
	
	var o = this.bui_move_info.obj;
	
	o.t = y - this.img_t;
	o.l = x - this.img_l;
	
	o.set_position(o.t, o.l);
};

// удалить перемещаемое здание по клавише del
/** @this {Object} */
p.delete_building_by_key = function( e ) {
	if ( !this.bui_moving ) return; // ничего не перемещается
	this.bui_moving = false;
	
	this.del_bui(this.bui_move_info.obj);
};

/** @this {Object} */
p.delete_building_by_mouse = function( e ) {
	this.del_bui(e.target.obj);
};

// тупо удалить коробку
/** @this {Object} */
p.del_bui = function( obj ) {
	if ( !obj ) return;
	obj.node.rem();
	obj.img_node.rem();
	if ( !obj.info.sq ) obj.drag_node.rem();
	this.refresh_buildings_tag_list();
};

/** @this {Object} */
p.sort_z_images = function() {
	if ( !this.in_iso ) return;
	
	for ( var i=0; i<this.buildings_tag_list.length; ++i ) {
		var o = this.buildings_tag_list[i].obj;
		
		var x = this.w - (o.full_w + o.i2d_l) / this.cell_w;
		var y = (o.i2d_t) / this.cell_h;
		var z = x+y+o.info.w/2+o.info.h/2;
		
		o.img_node.z(z);
	}
};

// вот тут уже вся хрень и происходит:
// - или здание оставляется на сетке
// - или если это территория - удаляется размещённая территория
/** @this {Object} */
p.place_building = function() {
	var o = this.bui_move_info.obj;
	
	if ( !o.can_place ) {
		if ( o.sq_on_sq ) {
			this.del_bui(o.sq_on_sq);
			o.sq_on_sq = false;
			o.can_place = true;
			o.intersect_restyle();
		} else {
			o.toggle_drag("on");
			setTimeout(function(){ o.toggle_drag("off"); }, 300);
		}
		
		return;
	}
	
	this.bui_moving = false;
	
	o.finish_building();
};

}());
