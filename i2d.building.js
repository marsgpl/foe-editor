// i2d building class
(function() {

/** @constructor */
i2d.building = function( conf ) {
	this.can_place = false;
	this.sq_on_sq = false; // если перемещаемый +кв находится над размещённым +кв

	for ( var key in conf ) {
		this[key] = conf[key];
	}

	this.init();
};

var p = i2d.building.prototype;

/** @this {Object} */
p.init = function() {
	if ( this.info.type == "*" ) {
		this.info = this.info.parent;
	}

	this.node = d.newNode("div");
	this.node.className = this.info.sq ? "i2d-bui-sq i2d-obj" : "i2d-bui i2d-obj";

	this.img_node = d.newNode("div");
	this.img_node.className = "i2d-bui-img";

	this.drag_node = d.newNode("div");
	this.drag_node.className = "i2d-bui-drag";

	this.node.innerHTML = this.info.t;
	this.node.obj = this;
	this.drag_node.obj = this;

	if ( this.info.parent_type ) {
		var url = "img/" + this.info.parent_type + this.info.type + ".png";///*;*/+"?"+Math.random();
		this.img_node.css({ background:"url('"+url+"') no-repeat bottom center" });
		this.toggle_img(false);
		this.toggle_border("on");
	}

	this.set_size();
	this.set_position(this.t, this.l);

	this.grid.node.appendChild(this.node);
	this.grid.img_node.appendChild(this.img_node);
	if ( !this.info.sq ) this.grid.drag_node.appendChild(this.drag_node);

	this.grid.refresh_buildings_tag_list();
};

/** @this {Object} */
p.set_direct_pos = function( x, y ) {
	this.i2d_t = y * this.grid.cell_h;
	this.i2d_l = x * this.grid.cell_w;

	this.node.t(this.i2d_t-1).l(this.i2d_l-1);
	this.drag_node.t(this.i2d_t).l(this.i2d_l);

	this.toggle_img(true);
	this.toggle_drag("off");
	this.finish_building();
};

p.finish_building = function() {
	this.toggle_border("off");

	if ( this.info.sq ) {
		this.node.innerHTML = "";

		this.node.css({
			background: "#FEFEFE url('img/grid.png') repeat top left",
			border: "1px solid #5EDD5E",
			width: this.full_w-1,
			height: this.full_w-1,
			top: this.i2d_t-1,
			left: this.i2d_l-1,
			margin: 0,
		});

		this.grid.node.appendChild(this.node);
	}

	this.grid.sort_z_images();
};

// on=show, off=hide
/** @this {Object} */
p.toggle_border = function( action ) {
	(!this.grid.in_iso || !this.info.parent_type || action=="on") ? this.node.show() : this.node.hide();
};

/** @this {Object} */
p.toggle_img = function( need_to_set_position ) {
	(this.grid.in_iso && this.info.parent_type) ? this.img_node.show() : this.img_node.hide();

	if ( need_to_set_position && this.grid.in_iso ) {
		this.set_img_position_by_node_position();
	}
};

/** @this {Object} */
p.set_img_position_by_node_position = function() {
	var x = this.i2d_l / this.grid.cell_w;
	var y = this.i2d_t / this.grid.cell_h;

	var l = (x+y)/2;
	var t = this.grid.h/2-(x-y)/2;

	l *= this.grid.cell_w_SR*2;
	t *= this.grid.cell_h_SR*2;

	var img_node_l = l;
	var img_node_t = t - this.img_full_h*(this.info.is_decor?4:3) + this.info.h*this.grid.cell_h_SR;

	this.img_node.l(img_node_l).t(img_node_t);
};

/** @this {Object} */
p.toggle_drag = function( action ) {
	this.drag_node.style.opacity = (action=="on") ? 1 : 0;
};

/** @this {Object} */
p.set_size = function() {
	this.full_w = this.info.w * this.grid.cell_w;
	this.full_h = this.info.h * this.grid.cell_h;

	var m = i2d.translate.exec(this.t, this.l, this.full_w, this.full_h);

	this.img_full_w = m.w;
	this.img_full_h = m.h;

	var sub_w = this.info.sq ? 1 : 7;
	var sub_h = this.info.sq ? 1 : 7;

	this.node.css({ lineHeight:this.full_h-sub_h });

	this.node.w(this.full_w-sub_w).h(this.full_h-sub_h);
	this.img_node.w(this.img_full_w).h(this.img_full_h*(this.info.is_decor?4:3));
	this.drag_node.w(this.full_w-1).h(this.full_h-1);
};

/** @this {Object} */
p.set_position = function( t, l ) {
	if ( this.grid.in_iso ) {
		this.set_position_iso(t, l);
	} else {
		this.set_position_2d(t, l);
	}

	this.check_collision();
};

/** @this {Object} */
p.set_position_2d = function( t, l ) {
	// центрировать по мыши всё
	if ( !this.info.sq ) {
		l -= this.full_w/2;
		t -= this.full_h/2;
	}

	t -= (this.grid.t - this.grid.img_t);
	l -= (this.grid.l - this.grid.img_l);

	if ( this.info.sq ) {
		if ( t<0 ) t -= this.grid.cell_h*4;
		if ( l<0 ) l -= this.grid.cell_w*4;
	}

	t = t - t % (this.grid.cell_h * (this.info.sq?4:1));
	l = l - l % (this.grid.cell_w * (this.info.sq?4:1));

	this.i2d_t = t;
	this.i2d_l = l;

	this.node.t(t-1).l(l-1);
	this.drag_node.t(t).l(l);
};

/** @this {Object} */
p.set_position_iso = function( t, l ) {
	// центрировать по мыши всё, кроме sq
	if ( !this.info.sq ) {
		l -= this.img_full_w/2;
	}

	t = t - t % this.grid.cell_h_SR;
	l = l - l % this.grid.cell_w_SR;

	var rel_t = Math.round(t/this.grid.cell_h_SR);
	var rel_l = Math.round(l/this.grid.cell_w_SR);

	var wid_even = !this.info.w%2;
	var pos_even = (rel_t+rel_l)%2;

	if ( (wid_even&&!pos_even) || (!wid_even&&pos_even) ) {
		rel_t++;
		t += this.grid.cell_h_SR;
	}

	rel_t -= this.grid.h;

	this.i2d_t = (rel_l+rel_t)/2;
	this.i2d_l = (rel_l-rel_t)/2;

	if ( this.info.sq ) {
		if ( this.i2d_t<0 ) this.i2d_t -= 3;
		if ( this.i2d_l<0 ) this.i2d_l -= 3;
		this.i2d_t = this.i2d_t - this.i2d_t % 4;
		this.i2d_l = this.i2d_l - this.i2d_l % 4;
	}

	this.i2d_t *= this.grid.cell_h;
	this.i2d_l *= this.grid.cell_w;

	var img_node_l = l;
	var img_node_t = t - this.img_full_h*(this.info.is_decor?4:3) + this.info.h*this.grid.cell_h_SR;

	this.node.t(this.i2d_t-1).l(this.i2d_l-1);
	this.img_node.l(img_node_l).t(img_node_t);
	this.drag_node.t(this.i2d_t).l(this.i2d_l);

	this.grid.sort_z_images();
};

/** @this {Object} */
p.check_collision = function() {
	this.can_place = true;
	this.sq_on_sq = false;

	for ( var i=0; i<this.grid.buildings_tag_list.length; ++i ) {
		var o = this.grid.buildings_tag_list[i].obj;

		if ( this===o ) continue;

		if ( (o.info.sq&&!this.info.sq) || (!o.info.sq&&this.info.sq) ) continue;

		if ( o.info.sq && this.info.sq &&
			o.i2d_t==this.i2d_t && o.i2d_l==this.i2d_l
		) { this.sq_on_sq = o; break; }

		if ( i2d.intersect(this.tblr(), o.tblr()) ) { this.can_place = false; break; }
	}

	this.can_place = (this.can_place && !this.sq_on_sq);
	this.intersect_restyle();
};

// get top bottom left right
/** @this {Object} */
p.tblr = function() {
	return {
		t: this.i2d_t,
		b: this.i2d_t + this.full_h,
		l: this.i2d_l,
		r: this.i2d_l + this.full_w,
	};
}

/** @this {Object} */
p.toggle_color = function( color ) {
	if ( color=="red" ) { // красный
		var bad_bg = (this.info.sq ? "rgba( 17, 73, 131, 0.5)" : "rgba( 255, 0, 0, 0.5)");
		var bad_border = (this.info.sq ? "#114983" : "#F00");
		this.node.css({
			backgroundColor: bad_bg,
			borderColor: bad_border,
		});
	} else if ( color=="green" ) { // зелёный
		this.node.css({
			backgroundColor: "rgba( 0, 255, 0, 0.5)",
			borderColor: "#009E15",
		});
	}
};

/** @this {Object} */
p.intersect_restyle = function() {
	if ( this.info.sq ) {
		this.node.style.color = (this.sq_on_sq ? "#FFF" : "#000");
		this.node.innerHTML = (this.sq_on_sq ? "Убрать" : "+16 кв.");
		this.toggle_color(this.sq_on_sq ? "red" : "green");
	} else {
		this.toggle_color(this.can_place ? "green" : "red");
	}
};

}());
