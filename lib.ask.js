// js lib user dialog

lib.ask = { w:0, h:0, padding:10 };
lib.ask.infected = false;
lib.ask.bgb = false;
lib.ask.body = false;
lib.ask.btns = false;
lib.ask.text = false;
lib.ask.opened = false;
lib.ask.resint = false;

lib.ask.show = function( conf ) {
	clearInterval(lib.ask.resint);
	if ( lib.ask.opened ) return lib.ask.resize(conf);
	
	lib.ask.opened = true;
	lib.ask.infect_d();
	lib.ask.fill(conf);
	lib.ask.setsize(conf["w"], conf["h"]);
	
	lib.ask.bgb.w(lib.getW(true)).h(lib.getH(true));
	
	lib.ot(lib.ask.bgb, 0, 0.7, null, null);
	lib.ot(lib.ask.body, 0, 1, null, null);
	lib.ask.body.show();
	lib.ask.bgb.show();
	
	if ( conf["cb"] ) conf["cb"](conf["cb_args"]);
	
	w.oncontextmenu = function(){return true;};
};

lib.ask.hide = function() {
	clearInterval(lib.ask.resint);
	if ( !lib.ask.opened ) return;
	
	lib.ask.dis_btns();
	lib.ot(lib.ask.bgb, 0.7, 0, function(){lib.ask.bgb.hide();}, null);
	lib.ot(lib.ask.body, 1, 0, function() {
		lib.ask.body.hide();
		lib.ask.body.innerHTML = "";
		lib.ask.opened = false;
	}, null);
	
	w.oncontextmenu = lib.antievent;
};

lib.ask.resize = function( conf ) {
	clearInterval(lib.ask.resint);
	if ( !lib.ask.opened ) return lib.ask.show(conf);
	
	lib.ask.fill(conf);
	lib.ask.rt(conf);
	
	if ( conf["cb"] ) conf["cb"](conf["cb_args"]);
};

lib.ask.setsize = function( w, h ) {
	var pp=lib.ask.padding*2;
	lib.ask.body.w(w-pp).h(h-pp).css({ marginLeft:-w/2, marginTop:-h/2 });
	if ( lib.ask.btns ) lib.ask.btns.w(w-pp);
	if ( lib.ask.text ) lib.ask.text.w(w-pp).h(h-pp-22);
	lib.ask.w=w, lib.ask.h=h;
};

lib.ask.rt = function( conf ) {
	clearInterval(lib.ask.resint);
	var fw=lib.ask.w, tw=conf["w"], fh=lib.ask.h, th=conf["h"];
	var sw=(fw-tw)/20, sh=(fh-th)/20;
	lib.ask.resint = setInterval(function(){
		var stop = false;
		lib.ask.w-=sw; lib.ask.h-=sh;
		if ( (fw>tw&&lib.ask.w<tw) || (fw<tw&&lib.ask.w>tw) ) { lib.ask.w=tw; stop=true; };
		if ( (fh>th&&lib.ask.h<th) || (fh<th&&lib.ask.h>th) ) { lib.ask.h=th; stop=true; };
		lib.ask.setsize(lib.ask.w, lib.ask.h);
		if ( stop ) clearInterval(lib.ask.resint);
	}, 10);
};

lib.ask.dis_btns = function() {
	if ( !lib.ask.btns ) return;
	var btns = lib.get("button", lib.ask.btns);
	for ( var i=0; i<btns.length; ++i ) btns[i].disabled=true;
};

lib.ask.fill = function( conf ) {
	var html = "";
	var pp = lib.ask.padding*2;
	
	var btns = conf["buttons"];
	
	if ( conf["html"] ) {
		html = conf["html"];
	} else if ( conf["text"] ) {
		conf["text"] = conf["text"].replace(/\n/g, "<br>");
		html = "<div id='lib.ask.text'><span>"+conf["text"]+"</span></div>";
	}
	
	if ( btns ) {
		html += "<div id='lib.ask.btns'>";
		for ( var i=0; i<btns.length; ++i ) {
			html += "<button id='lib.ask.btn."+i+"'>"+btns[i]["label"]+"</button>";
		}
		html += "</div>";
	}
	
	lib.ask.body.innerHTML = html;
	
	if ( btns ) {
		lib.ask.btns = lib.get("#lib.ask.btns");
		lib.ask.btns.w(conf["w"]-pp).css({
			position: "absolute",
			textAlign: "center",
			bottom: lib.ask.padding,
		});
		for ( var i=0; i<btns.length; ++i ) {
			var b = btns[i];
			var node = lib.get("#lib.ask.btn."+i);
			lib.bind(node, "mousedown", b["cb"]);
			//if ( lib.tip && b.tip ) lib.tip.infect(node, b.tip);
		}
	}
	
	if ( conf["text"] ) {
		lib.ask.text = lib.get("#lib.ask.text");
		lib.ask.text.w(conf["w"]-pp).h(conf["h"]-pp-22).show("table");
		lib.ask.text.firstChild.css({
			textAlign: "center",
			verticalAlign: "middle",
			whiteSpace: "pre"
		}).show("table-cell");
	}
};

lib.ask.onkey = function( e ) {
	switch ( lib.getKey(e) ) {
		case 27: // esc
			lib.ask.hide();
			break;
		case 32: // space
			if ( lib.ask.opened ) lib.antievent(e);
			break;
	}
};

lib.ask.infect_d = function() {
	if ( lib.ask.infected ) return;
	lib.ask.infected = true;
	
	var node;
	
	node = d.newNode("div");
	node.id = "lib.ask.window";
	node.z(200001).css({
		position: "absolute",
		background: "#DFDFDF",
		top: "50%",
		left: "50%",
		"borderRadius": 5,
		"boxShadow": "0 0 5px #000",
		"textShadow": "#AAA 1px 1px 1px",
		overflow: "hidden",
		padding: lib.ask.padding,
		display: "none"
	});
	d.body.appendChild(node);
	lib.ask.body = node;
	
	node = d.newNode("div");
	node.id = "lib.ask.bg";
	node.t(0).l(0).z(200000).css({
		position: "absolute",
		background: "#444",
		width: "100%",
		height: "100%",
		opacity: 0.7,
		display: "none"
	});
	d.body.appendChild(node);
	lib.ask.bgb = node;
	
	lib.bind(w, "keydown", lib.ask.onkey);
	lib.noselect(lib.ask.body);
};
