(function(root){
 function setup(host,type){root.EyyaSurfaceLoupe.close();if(!['severe','graffiti'].includes(type))return;for(const stage of host.querySelectorAll('.issue-panorama-image'))root.EyyaSurfaceLoupe.bind(stage,stage.querySelector('img'),{regions:'.issue-region',zoomable:true});}
 root.EyyaIssueInspection={setup};
})(window);
