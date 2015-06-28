(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var after, domReady, every, swfobject;

swfobject = require("swfobject");

after = function(ms, fn) {
  var tid;
  tid = setTimeout(fn, ms);
  return {
    stop: function() {
      return clearTimeout(tid);
    }
  };
};

every = function(ms, fn) {
  var iid;
  iid = setInterval(fn, ms);
  return {
    stop: function() {
      return clearInterval(iid);
    }
  };
};

domReady = function(callback) {
  if (/in/.test(document.readyState)) {
    return after(10, function() {
      return domReady(callback);
    });
  } else {
    return callback();
  }
};

(function(exports) {
  var FD, Font, FontListSWF, container, doneTestingFonts, dummy, fontAvailabilityChecker, fontListSWF, genericFontFamilies, loadFonts, someCommonFontNames, startedLoading, swfId, testFonts, testedFonts;
  FD = exports.FontDetective = {};
  FD.swf = "./flash/FontList.swf";
  genericFontFamilies = ["serif", "sans-serif", "cursive", "fantasy", "monospace"];
  someCommonFontNames = "Helvetica,Lucida Grande,Lucida Sans,Tahoma,Arial,Geneva,Monaco,Verdana,Microsoft Sans Serif,Trebuchet MS,Courier New,Times New Roman,Courier,Lucida Bright,Lucida Sans Typewriter,URW Chancery L,Comic Sans MS,Georgia,Palatino Linotype,Lucida Sans Unicode,Times,Century Schoolbook L,URW Gothic L,Franklin Gothic Medium,Lucida Console,Impact,URW Bookman L,Helvetica Neue,Nimbus Sans L,URW Palladio L,Nimbus Mono L,Nimbus Roman No9 L,Arial Black,Sylfaen,MV Boli,Estrangelo Edessa,Tunga,Gautami,Raavi,Mangal,Shruti,Latha,Kartika,Vrinda,Arial Narrow,Century Gothic,Garamond,Book Antiqua,Bookman Old Style,Calibri,Cambria,Candara,Corbel,Monotype Corsiva,Cambria Math,Consolas,Constantia,MS Reference Sans Serif,MS Mincho,Segoe UI,Arial Unicode MS,Tempus Sans ITC,Kristen ITC,Mistral,Meiryo UI,Juice ITC,Papyrus,Bradley Hand ITC,French Script MT,Malgun Gothic,Microsoft YaHei,Gisha,Leelawadee,Microsoft JhengHei,Haettenschweiler,Microsoft Himalaya,Microsoft Uighur,MoolBoran,Jokerman,DFKai-SB,KaiTi,SimSun-ExtB,Freestyle Script,Vivaldi,FangSong,MingLiU-ExtB,MingLiU_HKSCS,MingLiU_HKSCS-ExtB,PMingLiU-ExtB,Copperplate Gothic Light,Copperplate Gothic Bold,Franklin Gothic Book,Maiandra GD,Perpetua,Eras Demi ITC,Felix Titling,Franklin Gothic Demi,Pristina,Edwardian Script ITC,OCR A Extended,Engravers MT,Eras Light ITC,Franklin Gothic Medium Cond,Rockwell Extra Bold,Rockwell,Curlz MT,Blackadder ITC,Franklin Gothic Heavy,Franklin Gothic Demi Cond,Lucida Handwriting,Segoe UI Light,Segoe UI Semibold,Lucida Calligraphy,Cooper Black,Viner Hand ITC,Britannic Bold,Wide Latin,Old English Text MT,Broadway,Footlight MT Light,Harrington,Snap ITC,Onyx,Playbill,Bauhaus 93,Baskerville Old Face,Algerian,Matura MT Script Capitals,Stencil,Batang,Chiller,Harlow Solid Italic,Kunstler Script,Bernard MT Condensed,Informal Roman,Vladimir Script,Bell MT,Colonna MT,High Tower Text,Californian FB,Ravie,Segoe Script,Brush Script MT,SimSun,Arial Rounded MT Bold,Berlin Sans FB,Centaur,Niagara Solid,Showcard Gothic,Niagara Engraved,Segoe Print,Gabriola,Gill Sans MT,Iskoola Pota,Calisto MT,Script MT Bold,Century Schoolbook,Berlin Sans FB Demi,Magneto,Arabic Typesetting,DaunPenh,Mongolian Baiti,DokChampa,Euphemia,Kalinga,Microsoft Yi Baiti,Nyala,Bodoni MT Poster Compressed,Goudy Old Style,Imprint MT Shadow,Gill Sans MT Condensed,Gill Sans Ultra Bold,Palace Script MT,Lucida Fax,Gill Sans MT Ext Condensed Bold,Goudy Stout,Eras Medium ITC,Rage Italic,Rockwell Condensed,Castellar,Eras Bold ITC,Forte,Gill Sans Ultra Bold Condensed,Perpetua Titling MT,Agency FB,Tw Cen MT,Gigi,Tw Cen MT Condensed,Aparajita,Gloucester MT Extra Condensed,Tw Cen MT Condensed Extra Bold,PMingLiU,Bodoni MT,Bodoni MT Black,Bodoni MT Condensed,MS Gothic,GulimChe,MS UI Gothic,MS PGothic,Gulim,MS PMincho,BatangChe,Dotum,DotumChe,Gungsuh,GungsuhChe,MingLiU,NSimSun,SimHei,DejaVu Sans,DejaVu Sans Condensed,DejaVu Sans Mono,DejaVu Serif,DejaVu Serif Condensed,Eurostile,Matisse ITC,Bitstream Vera Sans Mono,Bitstream Vera Sans,Staccato222 BT,Bitstream Vera Serif,Broadway BT,ParkAvenue BT,Square721 BT,Calligraph421 BT,MisterEarl BT,Cataneo BT,Ruach LET,Rage Italic LET,La Bamba LET,Blackletter686 BT,John Handy LET,Scruff LET,Westwood LET".split(",").sort();
  testedFonts = [];
  doneTestingFonts = false;
  startedLoading = false;
  container = document.createElement("div");
  container.id = "font-detective";
  dummy = document.createElement("div");
  dummy.id = "font-detective-dummy";
  container.appendChild(dummy);
  swfId = "font-detective-flash";

  /*
  	 * A font class that can be stringified for use in css
  	 * e.g. font.toString() or (font + ", sans-serif")
   */
  Font = (function() {
    function Font(name, type, style) {
      this.name = name;
      this.type = type;
      this.style = style;
    }

    Font.prototype.toString = function() {
      return '"' + this.name.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"';
    };

    return Font;

  })();
  fontAvailabilityChecker = (function() {
    var baseFontFamilies, baseHeights, baseWidths, span;
    baseFontFamilies = ["monospace", "sans-serif", "serif"];
    span = document.createElement("span");
    span.innerHTML = "mmmmmmmmmmlli";
    span.style.fontSize = "72px";
    baseWidths = {};
    baseHeights = {};
    return {
      init: function() {
        var baseFontFamily, j, len, results;
        document.body.appendChild(container);
        results = [];
        for (j = 0, len = baseFontFamilies.length; j < len; j++) {
          baseFontFamily = baseFontFamilies[j];
          span.style.fontFamily = baseFontFamily;
          container.appendChild(span);
          baseWidths[baseFontFamily] = span.offsetWidth;
          baseHeights[baseFontFamily] = span.offsetHeight;
          results.push(container.removeChild(span));
        }
        return results;
      },
      check: function(font) {
        var baseFontFamily, differs, j, len;
        for (j = 0, len = baseFontFamilies.length; j < len; j++) {
          baseFontFamily = baseFontFamilies[j];
          span.style.fontFamily = font + ", " + baseFontFamily;
          container.appendChild(span);
          differs = span.offsetWidth !== baseWidths[baseFontFamily] || span.offsetHeight !== baseHeights[baseFontFamily];
          container.removeChild(span);
          if (differs) {
            return true;
          }
        }
        return false;
      }
    };
  })();
  FontListSWF = (function() {
    function FontListSWF() {
      this.callbacks = [];
      this.loading = false;
      this.loaded = false;
      this.failed = false;
    }

    FontListSWF.prototype.load = function(callback) {
      if (this.loaded) {
        return callback(null, this.swf);
      } else {
        this.callbacks.push(callback);
        if (!(this.loading || this.loaded || this.failed)) {
          this.loading = true;
          return domReady((function(_this) {
            return function() {
              var attributes, embedCallback, flashvars, params;
              flashvars = {
                swfObjectId: swfId
              };
              params = {
                allowScriptAccess: "always",
                menu: "false"
              };
              attributes = {
                id: swfId,
                name: swfId
              };
              embedCallback = function(e) {
                var cb, j, len, ref, results;
                _this.loading = false;
                if (e.success) {
                  _this.swf = e.ref;
                  _this.loaded = true;
                } else {
                  _this.failed = true;
                }
                ref = _this.callbacks;
                results = [];
                for (j = 0, len = ref.length; j < len; j++) {
                  cb = ref[j];
                  if (e.success) {
                    results.push(cb(null, _this.swf));
                  } else {
                    results.push(cb(new Error("Failed to load the SWF Object")));
                  }
                }
                return results;
              };
              document.body.appendChild(container);
              return swfobject.embedSWF(FD.swf, dummy.id, "1", "1", "9.0.0", false, flashvars, params, attributes, embedCallback);
            };
          })(this));
        }
      }
    };

    return FontListSWF;

  })();
  fontListSWF = new FontListSWF;
  loadFonts = function() {
    var fallback;
    if (startedLoading) {
      return;
    }
    startedLoading = true;
    fallback = function() {
      var fontName;
      FD.incomplete = true;
      return testFonts((function() {
        var j, len, results;
        results = [];
        for (j = 0, len = someCommonFontNames.length; j < len; j++) {
          fontName = someCommonFontNames[j];
          results.push(new Font(fontName));
        }
        return results;
      })());
    };
    return fontListSWF.load(function(err, swf) {
      var interval, timeout;
      if (err) {
        return fallback();
      } else {
        timeout = after(2000, function() {
          if (typeof interval !== "undefined" && interval !== null) {
            interval.stop();
          }
          return fallback();
        });
        return interval = every(50, function() {
          var fontName, fontStyle, fontType;
          if (swf.fonts) {
            if (interval != null) {
              interval.stop();
            }
            if (timeout != null) {
              timeout.stop();
            }
            return testFonts((function() {
              var j, len, ref, ref1, results;
              ref = swf.fonts();
              results = [];
              for (j = 0, len = ref.length; j < len; j++) {
                ref1 = ref[j], fontName = ref1.fontName, fontType = ref1.fontType, fontStyle = ref1.fontStyle;
                results.push(new Font(fontName, fontType, fontStyle));
              }
              return results;
            })());
          }
        });
      }
    });
  };
  testFonts = function(fonts) {
    var i, testingFonts;
    fontAvailabilityChecker.init();
    i = 0;
    return testingFonts = every(20, function() {
      var available, callback, font, j, k, l, len, len1, ref, ref1;
      for (j = 0; j <= 5; j++) {
        font = fonts[i];
        available = fontAvailabilityChecker.check(font);
        if (available) {
          testedFonts.push(font);
          ref = FD.each.callbacks;
          for (k = 0, len = ref.length; k < len; k++) {
            callback = ref[k];
            callback(font);
          }
        }
        i++;
        if (i >= fonts.length) {
          testingFonts.stop();
          ref1 = FD.all.callbacks;
          for (l = 0, len1 = ref1.length; l < len1; l++) {
            callback = ref1[l];
            callback(testedFonts);
          }
          FD.all.callbacks = [];
          FD.each.callbacks = [];
          doneTestingFonts = true;
          return;
        }
      }
    });
  };

  /*
  	 * FontDetective.preload()
  	 * Starts detecting fonts early
   */
  FD.preload = loadFonts;

  /*
  	 * FontDetective.each(function(font){})
  	 * Calls back with a `Font` every time a font is detected and tested
   */
  FD.each = function(callback) {
    var font, j, len;
    for (j = 0, len = testedFonts.length; j < len; j++) {
      font = testedFonts[j];
      callback(font);
    }
    if (!doneTestingFonts) {
      FD.each.callbacks.push(callback);
      return loadFonts();
    }
  };
  FD.each.callbacks = [];

  /*
  	 * FontDetective.all(function(fonts){})
  	 * Calls back with an `Array` of `Font`s when all fonts are detected and tested
   */
  FD.all = function(callback) {
    if (doneTestingFonts) {
      return callback(testedFonts);
    } else {
      FD.all.callbacks.push(callback);
      return loadFonts();
    }
  };
  return FD.all.callbacks = [];
})(window);


},{"swfobject":2}],2:[function(require,module,exports){
/*	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/
var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O[(['Active'].concat('Object').join('X'))]!=D){try{var ad=new window[(['Active'].concat('Object').join('X'))](W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?(['Active'].concat('').join('X')):"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();module.exports=swfobject;

},{}]},{},[1]);
