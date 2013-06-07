// isometric 2d lib

var i2d = {};

i2d.translate = {
	tga:  0.344327/*61329*/,
	rota: 0.7071/*06781187*/,
};

i2d.translate.exec = function( t,l,w,h ) {
	// центр фигуры
	var x0 = l + w/2;
	var y0 = t + h/2;
	
	// позиция точки skew 1 (левый угол)
	var x1S = l - h/2 * i2d.translate.tga;
	var y1S = t - w/2 * i2d.translate.tga;
	
	// позиция точки skew 2 (верхний угол)
	var x2S = l - h/2 * i2d.translate.tga + w;
	var y2S = t + w/2 * i2d.translate.tga;
	
	// позиция точки skew+rotation 1 (левый угол)
	var x1SR = x0 + (x1S-x0)*i2d.translate.rota + (y1S-y0)*i2d.translate.rota;
	var y1SR = y0 + (y1S-y0)*i2d.translate.rota - (x1S-x0)*i2d.translate.rota;
	
	// позиция точки skew+rotation 2 (верхний угол)
	var x2SR = x0 + (x2S-x0)*i2d.translate.rota + (y2S-y0)*i2d.translate.rota;
	var y2SR = y0 + (y2S-y0)*i2d.translate.rota - (x2S-x0)*i2d.translate.rota;
	
	var xD = x1S - x1SR;
	var yD = y2SR - y1S;
	var wS = w + h*i2d.translate.tga;
	var hS = h + w*i2d.translate.tga;
	var wD = wS + xD*2;
	var hD = hS - yD*2;
	
	return { t:y2SR,l:x1SR,w:wD,h:hD };
};

i2d.intersect = function( o1, o2 ) {
	return (
		( Math.min(o1.r, o2.r) - Math.max(o1.l, o2.l) ) > 0 &&
		( Math.min(o1.b, o2.b) - Math.max(o1.t, o2.t) ) > 0
	);
};

i2d.is_point_in_poly = function( o, t, l ) {
	return ( t>=o.t && t<=o.b && l>=o.l && l<=o.r );
};
