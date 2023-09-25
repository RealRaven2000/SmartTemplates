

var sales_end = new Date("2023-09-10");

/* functions that remove elements depending on the user type (from user=pro querystring ) */

var removableItems = [
	"smartTemplateProUser",
	"smartTemplateFreeUser",
	"smartTemplateProRenew"
];
var removedItems = [];


/* functions that remove elements depending on the user type (from user=pro querystring ) */

	function getQueryVariable(variable)	{
		var query = window.location.search.substring(1),
				vars = query.split("&");
		for (var i=0;i<vars.length;i++) {
			var pair = vars[i].split("=");
			if (pair[0] == variable) 
				return pair[1];
		}
		return(null);
	}

	function removeClassItems(name) {
		var dbuttons = document.getElementsByClassName(name);
		for (var i=dbuttons.length-1; i>=0; i--) {
			// dbuttons[i].style.display='none';
			dbuttons[i].parentNode.removeChild(dbuttons[i]);
		}
	}
	
	document.addEventListener("DOMContentLoaded", function(event) { 
		var user = getQueryVariable("user");
		if (typeof user!='undefined') {
			// propagate user type to all internal links
			if (user) {
				var navMenu = document.getElementsByClassName('navigation-list');
				if (navMenu.length) {
					var links = navMenu[0].children;
					for (var i=0; i<links.length; i++) {
						var href = links[i].getAttribute("href");
						if (href && href.indexOf("user="==-1)) {
							if (href.indexOf("?"==-1))
								links[i].setAttribute("href", href + "?user=" + user);
							else
								links[i].setAttribute("href", href + "&user=" + user);
						}
							
					}
				}
			}
			
			switch (user) {
        case 'std':
				case 'pro':
        case 'stdRenew':
				  removeClassItems('shilling');
					removeClassItems('donateButton');
          if (user == 'pro')
            removeClassItems('smartTemplateStdUser');
          else 
            removeClassItems('smartTemplateProUser');
					removeClassItems('smartTemplateFreeUser');
				  removeClassItems('smartTemplateProRenew');
					break;
				case 'proRenew':
					removeClassItems('smartTemplateStdUser');
					removeClassItems('donateButton');
					removeClassItems('smartTemplateFreeUser');
				  break;
				default:
          removeClassItems('smartTemplateStdUser');
				  removeClassItems('smartTemplateProRenew');
				  removeClassItems('smartTemplateProUser');
			}
			
		}
		
		// remove sales stuff
		if (sales_end && new Date() > sales_end) {
			removableItems.forEach(
				(e) => {
					if (!removedItems.includes(e)) {
						removeClassItems(e);
						removedItems.push(e);
					}
				}
			);
		}

	});
	
	

	