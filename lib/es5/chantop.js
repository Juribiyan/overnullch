'use strict';var _slicedToArray=function(){function sliceIterator(arr,i){var _arr=[],_n=!0,_d=!1,_e=void 0;try{for(var _s,_i=arr[Symbol.iterator]();!(_n=(_s=_i.next()).done)&&(_arr.push(_s.value),!(i&&_arr.length===i));_n=!0);}catch(err){_d=!0,_e=err}finally{try{!_n&&_i['return']&&_i['return']()}finally{if(_d)throw _e}}return _arr}return function(arr,i){if(Array.isArray(arr))return arr;if(Symbol.iterator in Object(arr))return sliceIterator(arr,i);throw new TypeError('Invalid attempt to destructure non-iterable instance')}}(),chanTop={vstep:50,init:function init($el,list){this.$el=$el.addClass('chantop'),this.$el.empty(),this.chans=list,this.load()},makeCSS:function makeCSS(count){var css='',vstep=this.vstep;_.range(count).forEach(function(p){var props='';has3d?['','-webkit-'].forEach(function(prefix){props+=prefix+'transform: translate3d(0, '+vstep*p+'px, 0);\n'}):props+='top: '+(vstep*p+10)+'px;',css+='#co-'+p+' {\n'+props+'}\n'}),css+='.chantop { height: '+count*vstep+'px }',injector.inject('chantop-positions',css)},load:function load(){var _this=this;this.makeCSS(this.chans.length),this.chans.forEach(function(chan){chan.$el=$(_this.buildChan(chan)),chan.$el.find('.adder-remover').click(function(){installer.toggle(chan.id)}),_this.$el.append(chan.$el)}),API.getRates(),this.upd=setInterval(function(){new Date().getTime()-_this.lastUpdated>_this.interval/2&&!$('#chantop').is(':hover')&&'hidden'!==$('#chantop').css('visibility')&&API.getRates()},this.interval)},stahp:function stahp(){clearInterval(this.upd)},updateRatings:function updateRatings(data){this.lastUpdated=new Date().getTime();var oldIDs=_.map(this.chans,'id'),newIDs=_.map(data,'id');return newIDs.length!==oldIDs.length||_.difference(oldIDs,newIDs).length?void document.location.reload():void(this.chans.forEach(function(chan){chan.rating=+_.find(data,{id:chan.id}).rating,chan.$el.find('.chan-rating').text(chan.rating)}),this.arrange())},interval:5e3,buildChan:function buildChan(chan){var isInstalled=installer.isInstalled(chan.id),xPlus=isInstalled?'\xD7':'+',addRemove=isInstalled?'\u0423\u0434\u0430\u043B\u0438\u0442\u044C':'\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C',name=_.escape(chan.name),wiki=chan.wiki&&chan.wiki.match(/https?:\/\//)?chan.wiki:conf.wiki+(chan.wiki||name);return'<div class="ct-chan"><img src="/chans/balls/'+chan.section+'/'+chan.id+'.png?uid='+chan._id+(chan.ballv?'&v='+chan.ballv:'')+'" alt="'+name+'" class="chan-avatar"><div class="catc-addremove adder-remover" title="'+addRemove+'">'+xPlus+'</div><a href="'+_.escape(chan.url)+'" target="_blank" class="chan-name"><span>'+name+'</span></a><div class="chan-rating">'+chan.rating+'</div><div class="chan-rating-delta"></div><a target="_blank" href="'+wiki+'" class="catc-info" title="\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F">i</a></div>'},arrange:function arrange(){var _this2=this;_.sortByOrder(chanTop.chans,['rating','name'],['desc','asc']).forEach(function(chan,i){if(chan.$el.attr('id','co-'+i),_this2.arranged){var hov=' hovering';if(i<chan.order?hov+=' going-up':i>chan.order?hov+=' going-down':hov='',chan.rating!==chan.oldRating){var deltaClass,delta=chan.rating-chan.oldRating;0<delta?(deltaClass='plus',delta='+'+delta):deltaClass='minus',chan.$el.find('.chan-rating-delta').text(''+delta).removeClass('plus minus').addClass(deltaClass)}chan.$el.addClass(hov+(delta?' delta-show':'')),setTimeout(function(){return chan.$el.removeClass('hovering going-down going-up delta-show')},1e3)}chan.order=i,chan.oldRating=chan.rating}),this.arranged=!0},arranged:!1,mockRandOrder:function mockRandOrder(rand){rand=rand||.3,this.chans.forEach(function(chan){Math.random()<rand&&(chan.rating=Math.round(1e3*Math.random()),chan.$el.find('.chan-rating').text(''+chan.rating))}),this.arrange()}},API={getRates:function getRates(){this.request('rates')},getChallenge:function getChallenge(){this.request('challenge')},captcha:function captcha(code){this.request('captcha','POST',{captcha:code})},vote:function vote(lr){'left'!==lr&&'right'!==lr&&this.handleError('You can only vote Left or Right'),this.request('vote','POST',{v:lr})},request:function request(act,method,toSend){var _this3=this;$.ajax({url:'api.php?act='+act,type:method||'GET',data:toSend||null}).done(function(data){return data.error?_this3.handleError(data.error):void _this3.handleData(data.data)}).fail(function(e){return _this3.handleError('XHR error: ',e)})},handleData:function handleData(data){data.hasOwnProperty('vote_success')&&$('body').removeClass('enter-captcha'),data.hasOwnProperty('rates')&&chanTop.updateRatings(data.rates),data.hasOwnProperty('challengers')&&Masher.setNewChallenge(data.challengers),data.hasOwnProperty('debug')&&console.log(data.debug)},handleError:function handleError(er){return this.specialErrors.hasOwnProperty(er)?this.specialErrors[er]():console.error(er),!1},specialErrors:{enter_captcha:function enter_captcha(){$('body').addClass('enter-captcha'),updateCaptcha()},wrong_captcha:function wrong_captcha(){$('#captcha-panel').addClass('wrong'),setTimeout(function(){return $('#captcha-panel').removeClass('wrong')},1e3),updateCaptcha()},force_reload:function force_reload(){return document.location.reload()}}};function updateCaptcha(){$('#cpanel-wrap img').attr('src','/captcha.php?color=200,200,200'),$('input[name=captcha]').val('').focus()}var Masher={init:function init($el,list){var _this4=this;this.$el=$el;var css='';list.forEach(function(chan){var $el=$(_this4.buildChan(chan));$el.find('a, .chan-options').click(function(ev){ev.stopPropagation()}),$el.find('.adder-remover').click(function(){installer.toggle(chan.id)}),_this4.pool[chan.id]=$el,css+='\n#ch_'+chan.id+' {\n '+_this4.gradient(chan.catbg)+' \n}'}),injector.inject('catalog-gradients',css),$('.challenger').click(function(){$('.catalog-chan').addClass('post'),API.vote($(this).attr('id').split('c-')[1])}),API.getChallenge()},pool:{},buildChan:function buildChan(chan){var isInstalled=installer.isInstalled(chan.id),xPlus=isInstalled?'\xD7':'+',addRemove=isInstalled?'\u0423\u0434\u0430\u043B\u0438\u0442\u044C':'\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C',name=_.escape(chan.name),wiki=chan.wiki&&chan.wiki.match(/https?:\/\//)?chan.wiki:conf.wiki+(chan.wiki||name);return'<div class="catalog-chan"><div class="cc-ball-wrap" id="ch_'+chan.id+'"><img src="/chans/balls/'+chan.section+'/'+chan.id+'.png?uid='+chan._id+(chan.ballv?'&v='+chan.ballv:'')+'" alt="'+name+'" class="cc-ball"><a href="'+_.escape(chan.url)+'" target="_blank" class="channame-overlay">'+name+'</a><div class="chan-options co-add adder-remover" title="'+addRemove+'">'+xPlus+'</div><a href="'+wiki+'" target="_blank" class="chan-options co-info" title="\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F">i</a></div></div>'},setNewChallenge:function setNewChallenge(pair){var _this5=this,_pair$map=pair.map(function(lr){return lr=_this5.pool[lr.id].addClass('pre').removeClass('post')}),_pair$map2=_slicedToArray(_pair$map,2),left=_pair$map2[0],right=_pair$map2[1];$('#c-left').append(left),$('#c-right').append(right),setTimeout(function(){$('.challenger .catalog-chan').removeClass('pre')},500)},gradient:function gradient(colors){var unprefixed='linear-gradient(to bottom, #'+colors[0]+' 0%, #'+colors[1]+' 100%)',res=/(((?:radial|linear)-gradient)\((?:(ellipse) at center|(-?[0-9]+)deg|to (right|bottom)), ?(.+)\));?/i.exec(unprefixed);if(null===res)return'background:'+unprefixed;res=_.rest(_.without(res,void 0));var gradientDirection,ret=res[0]+'; ',gradientType=res[1];gradientDirection=isNaN(res[2])?'bottom'==res[2]?'top, ':'right'==res[2]?'left, ':'center, ellipse cover, ':90-parseFloat(res[2])+'deg, ';var gradientStops=res[3];return _.each(['-o-','-webkit-','-moz-'],function(prefix){ret+='background:'+prefix+gradientType+'('+gradientDirection+gradientStops+'); '}),'background:'+ret}};function main(){$.ajaxSetup({dataType:'json'}),$.getJSON('/chans/chans.json?v='+new Date().getTime()).done(function(data){data.chans&&data.version?initAll(data.chans,data.version):console.error('bad-json')}).fail(function(err){return console.error(err)}),has3d=has3d()}function initAll(chans,version){chans.forEach(function(chan){chan.section=chan.default?'default':'custom'}),installer.init(chans,version),chanTop.init($('#chantop'),chans),Masher.init($('#battleground'),chans),$('header').click(function(){if(640>=$(window).width()){var unexpand=$('body').hasClass('xpnd');$('body').toggleClass('xpnd'),unexpand||$('#battleground-wrap').scrollTop(0)}}),$('#cpanel-wrap img').click(updateCaptcha),$('#captcha-panel').submit(function(ev){ev.preventDefault(),API.captcha($('input[name=captcha]').val())}),$(window).keydown(function(ev){$('body').hasClass('enter-captcha')||((37==ev.keyCode||65==ev.keyCode)&&API.vote('left'),(39==ev.keyCode||68==ev.keyCode)&&API.vote('right'))})}var installer={installed:[],init:function init(list,version){var _this6=this;this.list=list,this.versions=LSfetchJSON('catalogVersions')||{},this.versions.server=version;var myChans=LSfetchJSON('myChans_new');myChans&&myChans.length?myChans.forEach(function(mych){var found=_.find(list,{id:mych.id});_this6.installed.push(found||mych)}):this.installed=_.filter(list,{included:!0}),this.sync(!0)},sync:function sync(withVersions){localStorage.myChans_new=JSON.stringify(this.installed),withVersions&&(localStorage.catalogVersions=JSON.stringify(this.versions))},isInstalled:function isInstalled(chid){return!!_.find(this.installed,{id:chid})},indicate:function indicate(chid,xp,ar){[Masher.pool[chid],_.find(chanTop.chans,{id:chid}).$el].forEach(function($el){$el.find('.adder-remover').text(xp).attr('title',ar)})},install:function install(chid){var toInstall=_.find(this.list,{id:chid});toInstall&&(this.installed.push(toInstall),this.sync(),this.indicate(chid,'\xD7','\u0423\u0434\u0430\u043B\u0438\u0442\u044C'))},uninstall:function uninstall(chid){var removed=_.remove(this.installed,{id:chid});removed&&(this.sync(),this.indicate(chid,'+','\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C'))},toggle:function toggle(chid){this.isInstalled(chid)?this.uninstall(chid):this.install(chid)}},conf={wiki:'http://wiki.1chan.ca/'},injector={inject:function inject(alias,css){var id='injector:'+alias,existing=document.getElementById(id);if(existing)return void(existing.innerHTML=css);var head=document.head||document.getElementsByTagName('head')[0],style=document.createElement('style');style.type='text/css',style.id=id,style.styleSheet?style.styleSheet.cssText=css:style.appendChild(document.createTextNode(css)),head.appendChild(style)},remove:function remove(alias){var id='injector:'+alias,style=document.getElementById(id);if(style){var head=document.head||document.getElementsByTagName('head')[0];head&&head.removeChild(document.getElementById(id))}}};function has3d(){if(!window.getComputedStyle)return!1;var has3d,el=document.createElement('p'),transforms={webkitTransform:'-webkit-transform',OTransform:'-o-transform',msTransform:'-ms-transform',MozTransform:'-moz-transform',transform:'transform'};for(var t in document.body.insertBefore(el,null),transforms)void 0!==el.style[t]&&(el.style[t]='translate3d(1px,1px,1px)',has3d=window.getComputedStyle(el).getPropertyValue(transforms[t]));return document.body.removeChild(el),void 0!==has3d&&0<has3d.length&&'none'!==has3d}function LSfetchJSON(key){var val=null,data=localStorage[key];if('undefined'!=typeof data)try{val=JSON.parse(data)}catch(e){console.error(e),localStorage.removeItem(key)}return val}
//# sourceMappingURL=chantop.js.map