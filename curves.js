/* common code for svg curves for nomograms 
 * Phil Martel
 */
/* 
Copyright (c) 2016 Philip Martel
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR 
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
DEALINGS IN THE SOFTWARE.
*/
// import 'Vectors'; doesn't work currently
// <script lang="ecmascript" src='Vectors.js' ></script>
//import Vector from 'Vectors.js';

// Specify the svg to fill the a good part of the page (so far no obvious way to do "all")
// This runs when the scrip is loaded

// these worked before I was using <!DOCTYPE html>
//dWidth = document.body.clientWidth*0.85;	
//dHeight = screen.availHeight*0.7;

// it took a while to find window.inner* .
var dWidth = window.innerWidth * 0.85;
var dHeight = window.innerHeight * 0.8;

// make a square drawing region
var dMin = Math.min(dWidth,dHeight);
var pCenter = new Vector(dWidth/2,dHeight/2);
var pMin = new Vector(dMin/2,dMin/2);
var pMax = pCenter.add(pMin);
pMin = pCenter.sub(pMin);


var scale0 = new Vector( dMin*0.1, dMin*0.9);
var scale100 = new Vector( dMin*0.9, dMin*0.1);
var scaleDelta = scale100.sub(scale0);

var home = document.getElementById("home");

// prototype for Curve object
var Curve = function(){
	o = {};
	o.title = {x:0,y:0,t:""}; // curve title info
	o.domain=[]; //points we'll be plotting
	o.scale=[]; // labelled points
	o.majorTicPoints=[];
	o.majorTics=[];
	o.minorTics=[];
	o.delta=undefined; // small value for slope calculation
	o.x; // parametric function for x values of curve
	o.y; // parametric function for y values of curve
	return o;
}


function drawCurve(o){ //debugger;
	var t = '';
	var i, delta = Infinity, d1;
	var p;
	
	// draw curve
	p = new Vector(o.x(o.domain[0]),o.y(o.domain[0]));
	p = scaleToSVG(p);
	// move to the beginning, start path
	t = '<path d="M '+p.x+' '+p.y;
	for(i=1;i<o.domain.length;i++){
	   p.x = o.x(o.domain[i]);
	   p.y = o.y(o.domain[i]);
	   p = scaleToSVG(p);
	   t += ' L '+p.x+' '+p.y;
	}
	//close path
	t += '" stroke="black" fill="none" />\n';
		
	// if delta value is undefined, find the smallest minor tic delta and use 0.1 of that
	if(o.delta == undefined){
		for(i=1;i<o.minorTics.length;i++){
			d1 = Math.abs(o.minorTics[i] - o.minorTics[i-1]);
			if ( d1 < delta){
				delta = d1;
			}
		}
		o.delta = 0.1 * delta;
	}
	
	// draw major tics and find scale positions
	// assume scale positions are a subset of major tics
	// the major tics and minor tics are also paths
	
	t += drawTics(o,"majorTics");
	// draw minor tics
    t += drawTics(o,"minorTics",i);
	// add scale text
	t += addScaleText(o);
	// add label
	p.x = o.title.x; p.y = o.title.y;
	p = scaleToSVG(p);
	t += '<text  font-size="20" font-family="Verdana" x="'+p.x+'" y="'+p.y+'">'+
		o.title.t+'</text>\n';
	return t; 
}

// draw the tics for the curve associated with object o specified by type
function drawTics(o, type ){ 
	var t1 ="";
	var arr;
	var ticLen, i, temp;
	var p0= new Vector(), p1= new Vector(), p2= new Vector();
	var doScale = false;
    var ticInfo = {};
	
	if (type == 'majorTics'){
		arr = o.majorTics;
		ticLen =1;
		doScale = true;
	}
	else if (type == 'minorTics'){
		arr = o.minorTics;
		ticLen =0.5;
	} else {
		//error.  should not happen 
	}
 	t1 = '<path d="';
	for( i=0;i<(arr.length);i++){
		// get a ticLen long vector at right angles to the curve at p0
		ticInfo = drawATic(o, arr, i, ticLen, type);
		t1 += ticInfo.t;
		if(doScale){
			o.majorTicPoints[i] = ticInfo;
		}
	}

//close path
	t1 += '" stroke="black" fill="none" />\n'
	return t1;
}

function drawATic(o, arr, i1, ticLen, type){
	var ticInfo ={};
	var p0= new Vector(), p1= new Vector(), p2= new Vector();
	var temp, j, v0, v1;
	
	v0 = arr[i1];
	v1 = v0+ o.delta;
	p0.x = o.x(v0); p0.y = o.y(v0);
	p1.x = o.x(v1); p1.y = o.y(v1);
	p1 = p0.sub(p1);
	p1 = p1.scale(ticLen/p1.len()); // this is a vector ticLen long
	 // this makes an orthogonal vector to the original p1
	 temp = p1.x; p1.x = p1.y; p1.y=-temp;
	p2 = p1;
	p1 = p0.add(p1);
	p1 = scaleToSVG(p1);
	p2 = p0.sub(p2);
	p2 = scaleToSVG(p2);
	ticInfo.p1 =p1;
	ticInfo.p2 = p2;
	if(type == 'minorTics'){ 
		// skip if it's also a major tic (possible double line)
		temp = arr[i1];
		j = o.majorTics.indexOf(temp);
		if( j > -1){
			ticInfo.t ='';
			return ticInfo;
		}
	}
	ticInfo.t = ' M '+p1.x +' '+p1.y+' L '+p2.x+' '+p2.y;

	return ticInfo;
}

function addScaleText(o){
	var i, j, v;
	var t3 = "";
	var p1= new Vector(), p2 = new Vector(), pDif = new Vector();
	var offset = new Vector(0.5,4); // Emperically, for horizontal text an offset of (0.5,4) works to center and offset the scale
	var rOff = new Vector();
	var a,c,s;
	
	for(i=0;i<o.scale.length;i++){
		v = o.scale[i];
		j = o.majorTics.indexOf(v);
		if(j == -1){ // scale point does not match major tic.  Should not happen.
			continue;
		}
		p1 = o.majorTicPoints[j].p1;
		p2 = o.majorTicPoints[j].p2;
		//p1 = p2.sub(p1); //doesn't work even though Vector() does...
		pDif.x = p2.x - p1.x; pDif.y = p2.y - p1.y;
		
		if (pDif.x < 0){// reverse direction of label and use p1 instead of p2
			a = Math.atan2(-pDif.y,-pDif.x);
			p2.x = p1.x; p2.y = p1.y;
			c = Math.cos(a); s = Math.sin(a);
			rOff.x = -offset.x * c - offset.y * s;
			rOff.y = offset.y * c - offset.x * s;
		}
		else {
			a = Math.atan2(pDif.y,pDif.x);
			c = Math.cos(a); s = Math.sin(a);
			rOff.x = offset.x * c + offset.y * s;
			rOff.y = offset.y * c + offset.x * s;
		}
		// p2 = p2.add(offset);  doesn't work even though Vector() does...
		p2.x += rOff.x; p2.y += rOff.y;
		//  <text x="20" y="20" fill="red" transform="rotate(90 20,20)">I love SVG</text>
		// rotate seems to be angle and rotate position. In general easiset if it is the same as (x,y)
		// this may work better  transform="translate(200,100)rotate(180)">Hello!</text>
		//t3 += '<text  font-size="12" font-family="Verdana" x="'+p.x+'" y="'+p.y+'">'+
		t3 += '<text  font-size="12" font-family="Verdana" transform="translate('+p2.x+','+p2.y+')rotate('+a*180/Math.PI+')">'+
		v+'</text>\n';
	}
	return t3;
}

// this takes a Vector -object and scales it from the "paper" 100 x 100 square to the svg space
function scaleToSVG(p){
	var pS = new Vector( pMin.x + scale0.x + scaleDelta.x *p.x/100, scale0.y + scaleDelta.y *p.y/100);
	return pS;
}
