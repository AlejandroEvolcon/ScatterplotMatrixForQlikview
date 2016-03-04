Qva.LoadScript('/QvAjaxZfc/QvsViewClient.aspx?public=only&name=Extensions/Evolcon/ScatterplotMatrix/d3.min.js', function (){

    Qva.AddExtension('Evolcon/ScatterplotMatrix', function(){
	
        Qva.LoadCSS("/QvAjaxZfc/QvsViewClient.aspx?public=only&name=Extensions/Evolcon/ScatterplotMatrix/style.css");
        
        //Create reference to the qlikview sheet extension object
        var _this = this;
        var unico = true;
        //Get width and height of the qlikview sheet extension object
        var vw = _this.GetWidth();
        var vh = _this.GetHeight();
        
        //Get all data from the qlikview result
        _this.Data.SetPagesize(_this.Data.TotalSize);

        //Set values for presentation
        var margin = {top: 20, right: 20, bottom: 20, left: 50};
        var width = _this.GetWidth() - margin.right - margin.left;

        var color = d3.scale.category10();
        
        var customers = [];
		var groups = [];
        var domainByTrait = {};
        var traits = [];
        
        var divID = "ScateerplotMatrix" + new Date().getTime().toString();
		
        //Get groups
        for(var i = 0; i<_this.Data.Rows.length; i++){
            if((groups.lastIndexOf(_this.Data.Rows[i][1].text)) == -1){
                groups.push(_this.Data.Rows[i][1].text);
            }
        }
        color.domain(groups);
    
        //Get categories
        var tableHeaders = _this.Data.HeaderRows[0];
        for(var i = 2; i<tableHeaders.length; i++){
            traits.push(tableHeaders[i].text);
        }
        n = traits.length;
        
        //Set values for presentation
        var size = (width * 0.750)/n;
        var padding = 20;
        var x = d3.scale.linear().range([padding / 2, size - padding / 2]);
        var y = d3.scale.linear().range([size - padding / 2, padding / 2]);
        
        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5);
        var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);
        
        //Get maximun and minimun of each category
        for(var j = 2; j<_this.Data.Rows[0].length; j++){
            var values = [];
            for(var i = 0; i<_this.Data.Rows.length; i++){
                values.push(parseFloat(_this.Data.Rows[i][j].text));
            }
            domainByTrait[tableHeaders[j].text] = d3.extent(values);
        }
        
        //Format data
        var data = [];
        for(var i = 0; i<_this.Data.Rows.length; i++){
            var register = {};
            for(var j = 2; j<_this.Data.Rows[0].length; j++){
                register[tableHeaders[j].text] = parseFloat(_this.Data.Rows[i][j].text);
            }
            register[tableHeaders[0].text] = _this.Data.Rows[i][0].text;
			register[tableHeaders[1].text] = _this.Data.Rows[i][1].text;
            data.push(register);
        }

        var brush = d3.svg.brush()
            .x(x)
            .y(y)
            .on("brushstart", brushstart)
            .on("brush", brushmove)
            .on("brushend", brushend);
        
        xAxis.tickSize(size * n);
        yAxis.tickSize(-size * n);
        
        _this.Element.innerHTML= '<div id=' + divID
                + ' style="width:' + width + 'px;'
                + 'left: 0; position: absolute;'
                + 'top: 0;z-index:999;"></div>';
        
        var svg = d3.select("#" + divID).append("svg")
            .attr("width", size * n + padding)///
            .attr("height", size * n + padding)
            .append("g")
            .attr("transform", "translate(" + (padding + margin.left) + "," + padding / 2 + ")");

        svg.selectAll(".x.axis")
            .data(traits)
            .enter().append("g")
            .attr("class", "x axis")
            .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
            .each(function(d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); })//;
            .selectAll("text")
            .attr("transform", function(d, i) { return "translate(" + (-size*n - padding + 10) + "," + (size*n + padding) +")rotate(270)"; });

        svg.selectAll(".y.axis")
            .data(traits)
            .enter().append("g")
            .attr("class", "y axis")
            .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
            .each(function(d) { y.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

        var cell = svg.selectAll(".cell")
            .data(cross(traits, traits))
            .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
            .each(plot);

        // Titles for the diagonal.
        cell.filter(function(d) { return d.i === d.j; }).append("text")
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", ".71em")
            .text(function(d) { /*return d.j*/ return eval("_this.Layout.Text"+d.j+".text")});
    
        d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");
        
        // Set titles for category
        for(var i=0; i<groups.length; i++){
            svg.append("text")
                .attr("x", size * n + padding + 10)
                .attr("y", size * n + (i * 20) - 50)
                .text(groups[i]);
            svg.append("circle")
                .attr("cx", size * n + padding + 0)
                .attr("cy", size * n + (i * 20) - 50)
                .attr("r", 3)
                .style("fill", color(groups[i]));
        }
        
        cell.call(brush);
        //Draw the points
        function plot(p) {
            var cell = d3.select(this);

            x.domain(domainByTrait[p.x]);
            y.domain(domainByTrait[p.y]);
            
            cell.append("rect")
                .attr("class", "frame")
                .attr("x", padding / 2)
                .attr("y", padding / 2)
                .attr("width", size - padding)
                .attr("height", size - padding);

            cell.selectAll("circle")
                .data(data)
                .enter().append("circle")
                .attr("cx", function(d) { return x(d[p.x]); })
                .attr("cy", function(d) { return y(d[p.y]); })
                .attr("r", 3)
                .style("fill", function(d) { return color(d[tableHeaders[1].text]); });
        
            cell.selectAll("circle")
                .append("svg:title")
                .text( function(d) {return tableHeaders[0].text + ": " + d[tableHeaders[0].text] + ' -- \n' + p.x + ":" + d[p.x].toString() + " " + p.y +":" + d[p.y].toString() + ""; });
        }
        
        var brushCell;
        
        // Clear the previously-active brush, if any.
        function brushstart(p) {
          if (brushCell !== this) {
            d3.select(brushCell).call(brush.clear());
            x.domain(domainByTrait[p.x]);
            y.domain(domainByTrait[p.y]);
            brushCell = this;
          }
        }
        
        // Highlight the selected circles.
        function brushmove(p) {
          var e = brush.extent();
          
          svg.selectAll("circle").classed("hidden", function(d) {
          try{
            return e[0][0] > d[p.x] || d[p.x] > e[1][0]
                || e[0][1] > d[p.y] || d[p.y] > e[1][1];
          }
          catch(e){
              //alert(e)
          };
          });
        }
        
        // If the brush is empty, select all circles.
        function brushend() {
          if (brush.empty()) svg.selectAll(".hidden").classed("hidden", false);
        }

        function cross(a, b) {
            var c = [], n = a.length, m = b.length, i, j;
            for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
            return c;
        }

        function objToString(obj) {
            var str = '';
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str += p + '->' + obj[p] + '<br/><br/>';
                }
            }
            return str;
        }


    },true); //End AddExtension

}); //End LoadScript



	
