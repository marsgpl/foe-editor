// js lib

var w = window;
var d = document;

var sp = String.prototype;
var hp = HTMLElement.prototype;

var lib = {};

d.newNode = d.createElement;



lib.isnum = function( n ) {
	return !isNaN(parseFloat(n)) && isFinite(n);
};

/** @param {...Object} scope */
lib.bind = function( node, event_name, callback, scope ) {
	var fu = scope ? function(e){ callback.call(scope, e); } : callback;
	node.addEventListener(event_name, fu, false);
};

/** @param {...HTMLElement} parent */
lib.get = function( expr, parent ) {
	var type = expr.substr(0,1);
	var name = expr.substr(1);

	parent = parent || d;

	switch ( type ) {
		case "#": return d.getElementById(name);
		case ".": return parent.getElementsByClassName(name);
		default: return parent.getElementsByTagName(expr);
	}
};

lib.antievent = function( e ) {
	e.preventDefault();
	e.stopPropagation();
	e.returnValue = false;
	e.cancelBubble = true;
};

lib.noselect = function( node ) {
	node.css({ WebkitUserSelect:"none", MozUserSelect:"none" });
	lib.bind(node, "selectstart", lib.antievent);
};

lib.getW = function( max ) {
	return max ? d.body.scrollWidth : w.innerWidth;
};

lib.getH = function( max ) {
	return max ? d.body.scrollHeight : w.innerHeight;
};

lib.getKey = function( e ) {
	return e.which || e.keyCode || e.charCode || 0;
};

// opacity to value (slow and smooth)
lib.ot = function( node, from, to, cb, params ) {
	if ( node.lib_ot ) clearInterval(node.lib_ot);
	var step = (from-to)/20;
	var f = from;
	node.style.opacity = f;
	node.lib_ot = setInterval(function(){
		f -= step;
		node.style.opacity = f;
		if ( (from>to&&f<=to) || (from<to&&f>=to) ) {
			clearInterval(node.lib_ot);
			if ( cb ) cb(params);
		}
	}, 10);
};



/** @this {String} */
sp.repeat = function( n ) {
	return (new Array(n+1)).join(this);
};

/** @this {String} */
sp.trim = function() {
	return this.replace(/^\s+/, "").replace(/\s+$/, "");
};



/** @this {HTMLElement} */
hp.rem = function() {
	this.parentNode.removeChild(this);
};

/** @this {HTMLElement} */
hp.css = function( css ) {
	for ( var key in css ) {
		var value = css[key];
		if ( lib.isnum(value) && key != "zIndex" && key != "opacity" ) value += "px";
		this.style[key] = value;
	}
	return this;
};

/** @param {...String} display_as */
/** @this {HTMLElement} */
hp.show = function( display_as ) {
	this.style.display = display_as ? display_as : "block";
	return this;
};

/** @this {HTMLElement} */
hp.hide = function() {
	this.style.display = "none";
	return this;
};

/** @param {...Number} value */
/** @this {HTMLElement} */
hp.t = function( value ) {
	if ( value==null ) {
		return parseInt(this.style.top, 10);
	} else {
		this.style.top = Math.round(parseFloat(value)) + "px";
		return this;
	}
};

/** @param {...Number} value */
/** @this {HTMLElement} */
hp.l = function( value ) {
	if ( value==null ) {
		return parseInt(this.style.left, 10);
	} else {
		this.style.left = Math.round(parseFloat(value)) + "px";
		return this;
	}
};

/** @param {...Number} value */
/** @this {HTMLElement} */
hp.w = function( value ) {
	if ( value==null ) {
		return parseInt(this.style.width, 10);
	} else {
		this.style.width = Math.round(parseFloat(value)) + "px";
		return this;
	}
};

/** @param {...Number} value */
/** @this {HTMLElement} */
hp.h = function( value ) {
	if ( value==null ) {
		return parseInt(this.style.height, 10);
	} else {
		this.style.height = Math.round(parseFloat(value)) + "px";
		return this;
	}
};

/** @param {...Number} value */
/** @this {HTMLElement} */
hp.z = function( value ) {
	if ( value==null ) {
		return parseInt(this.style.zIndex, 10);
	} else {
		this.style.zIndex = parseInt(value, 10);
		return this;
	}
};
