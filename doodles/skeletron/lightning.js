"use strict";
var lightning = {
		minDelay: 5,
		maxDelay: 30,
		getDelay: function getDelay() {
			return (
				1e3 * (this.minDelay + Math.random() * (this.maxDelay - this.minDelay))
			);
		},
		minStrikes: 1,
		maxStrikes: 5,
		getStrikes: function getStrikes() {
			return Math.round(
				this.minStrikes + Math.random() * (this.maxStrikes - this.minStrikes)
			);
		},
		run: function run() {
			var a = this;
			setTimeout(function() {
				a.strike(), a.run();
			}, this.getDelay());
		},
		strike: function strike() {
			var a = this;
			injector.remove("lightning"),
				setTimeout(function() {
					injector.inject(
						"lightning",
						"html { -webkit-animation-timing-function: step-start; -o-animation-timing-function: step-start; animation-timing-function: step-start; -webkit-animation-iteration-count: " +
							a.getStrikes() +
							"; -o-animation-iteration-count: " +
							a.getStrikes() +
							"; animation-iteration-count: " +
							a.getStrikes() +
							"; -webkit-animation-name: lightning; -o-animation-name: lightning; animation-name: lightning; -webkit-animation-duration: .1s; -o-animation-duration: .1s; animation-duration: .1s;}"
					);
				}, 100);
		}
	},
	injector = {
		inject: function inject(a, b) {
			var c = "injector:" + a,
				d = document.getElementById(c);
			if (d) return void (d.innerHTML = b);
			var e = document.head || document.getElementsByTagName("head")[0],
				f = document.createElement("style");
			(f.type = "text/css"),
				(f.id = c),
				f.styleSheet
					? (f.styleSheet.cssText = b)
					: f.appendChild(document.createTextNode(b)),
				e.appendChild(f);
		},
		remove: function remove(a) {
			var b = "injector:" + a,
				c = document.getElementById(b);
			if (c) {
				var d = document.head || document.getElementsByTagName("head")[0];
				d && d.removeChild(document.getElementById(b));
			}
		}
	};