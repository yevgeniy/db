(function(){
  var isCommonJS = typeof window == "undefined";
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
  var _guid=0;
  
  var List = (function() {

    function List() {
      this.length = 0;
    }
    List.prototype.first = null;
    List.prototype.last = null;
    List.prototype.length = null;
    
    List.prototype._push=function(item){
      if (this.last != null) {
        this.last.next = item;
        item.previous = this.last;
        this.last = item;
      }
      if (!(this.first != null)) this.first = item;
      if (!(this.last != null)) this.last = item;
      this.length++;
      return item;
    }
    List.prototype.push = function(d) {
      return this._push(new ListeItem(d));
    };

    List.prototype._pop = function() {
      var item;
      if (this.last != null) {
        item = this.last;
        if (item.previous != null) item.previous.next = null;
        this.last = item.previous;
        item.previous = null;
        if (!(this.last != null)) this.first = null;
        this.length--;
        return item;
      } else {

      }
    };

    List.prototype.pop = function() {
      var _ref;
      return (_ref = _pop()) != null ? _ref.data : void 0;
    };

    List.prototype._shift = function() {
      var item;
      if (this.first != null) {
        item = this.first;
        if (item.next != null) item.next.previous = null;
        this.first = item.next;
        item.next = null;
        if (!this.first) this.last = null;
        this.length--;
        return item;
      } else {

      }
    };

    List.prototype.shift = function() {
      var _ref;
      return (_ref = _shift()) != null ? _ref.data : void 0;
    };
    List.prototype._unshift = function(item) {
      if (this.first != null) {
        this.first.previous = item;
        item.next = this.first;
        this.first = item;
      }
      if (!(this.first != null)) this.first = item;
      if (!(this.last != null)) this.last = item;
      this.length++;
      return item;
    }
    List.prototype.unshift = function(d) {
      return this._unshift(new ListeItem(d));
    };

    List.prototype.remove = function() {
      var item, _i, _len;
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        item = arguments[_i];
        if (item.previous != null) item.previous.next = item.next;
        if (item.next != null) item.next.previous = item.previous;
        if (this.first === item) this.first = item.next;
        if (this.last === item) this.last = item.previous;
        this.previous = this.next = null;
        this.length--;
      }
      return;
    };
    List.prototype.toArray=function(){
      ret=[];
      c=this.first;
      while (c!=null) {
        ret.push(c);
        c=c.next;
      }
      return ret;
    }

    return List;
  })();

  var ListItem = (function() {

    function ListItem(d) {
      this.data = d;
    }
    ListItem.prototype.data = null;
    ListItem.prototype.next = null;
    ListItem.prototype.previous = null;

    return ListItem;
  })();
  
  var DB=(function(){
    __extends(DB, List);
    
    function DB(){
      DB.__super__.constructor.call(this);
      
      this.indexing=new Indexing(this);
    }
    
    DB.prototype.effected=null;
    DB.prototype.selected=null;
    DB.prototype.indexing=null;
    
    DB.prototype.push=function(d){
      var i
      ,row = this._push(new Row(d))
      ;

      return row; 
    }
    DB.prototype.unshift=function(d){
      return DB.prototype._unshift(new Row(d));
    }
    DB.prototype._select=function(fn){
      var _this=this
      ,src
      ,map
      ;
      switch (typeof fn){
        case 'undefined':
          map=function(rowData){
            return rowData;
          };
          break;
        case 'function':
          map=fn;
          break;
        case 'string':
          map=function(rowData){
            return rowData[fn];
          };
          break;
      }
      
      src = this.selected==null
        ? this.toArray()
        : this.selected;
      this.selected=null;
      
      return src.map(function(v,i){
        return map(v.data);
      });
    }
    DB.prototype.select=function(fn){
      return this._select(fn);
    }
    DB.prototype.selectFirst=function(fn){
      return this._select(fn)[0];
    }
    DB.prototype.insert=function(rows){
      this.selected=null;
      
      var _this=this
      ,src, item
      ;
      
      this.effected=[];
      
      
      if (rows instanceof Array)
        src=rows;
      else 
        src=[rows];
      
      src.forEach(function(v,i){
        if (v instanceof Row)
          item = _this.push(v.data);
        else 
          item = _this.push(v);
        
        for (var i in _this.indexing.index)
          if (typeof item.data[i] != 'undefined')
          	_this.indexing.insert(item, i);
        
        _this.effected.push(item);
      });

      return this;
    }
    DB.prototype._updateRowSubject=function(row, subject, newValue){
      if (subject)
        if (row.data[subject]!==newValue){
          if (this.indexing.index[subject])
          	this.indexing.update(row, subject, newValue, row.data[subject]);
          row.data[subject]=newValue;
        }
    }
    
    DB.prototype.update=function(data){
      var _this=this
      ,src
      ,i
      ;
      
      data = data instanceof Row
        ? data.data
        : data;
      
      src = this.selected==null
        ? this.toArray()
        : this.selected;
      this.selected=null;
        
      this.effected=[];
      src.forEach(function(row,i){
        for (i in data)
          _this._updateRowSubject(row, i, data[i])
        _this.effected.push(row);  
      });
      
      return this;
    }
    DB.prototype._testConjunct=function(conjunct, value){
      var _this=this;
      var ret = true;
      for (var i in conjunct) {
        if (typeof DB.test[i] == 'undefined')
          throw "test '" + i + "' does not exist";
        
        var args = conjunct[i];
        if (args instanceof Array === false)
          args=[args];

        if ( DB.test[i].apply({value:value}, args) === false){
          ret=false;break;
        }
      }
      return ret;
    }
    DB.prototype._normalizeQuery=function(query){
      if (query instanceof Array === false)
        query=[query];
      return query;
    }
    DB.prototype._normalizeConjunct=function(conjunct){
      if (typeof conjunct != 'object'){ /* Simple value. */
        conjunct = {
          is:conjunct
        };
      }
      
      return conjunct;
    }
    DB.prototype._normalizePredicate=function(predicate){
      var _this=this
      ;
      if (predicate instanceof Array === false)
        predicate = [predicate];
      
      predicate = predicate.map(function(conjunct){
        return _this._normalizeConjunct(conjunct);
      });
      return predicate;
    }
    DB.prototype._normalizeComplex=function(complex){
      var _i
      ;
      for (_i in complex)
        complex[_i] = this._normalizePredicate(complex[_i]);
      
      return complex;
    }
    DB.prototype._testPredicate=function(predicate, value){
      var _this = this
      ,ret=false
      ;
      
      predicate.every(function(conjunct){
        
        if (ret = _this._testConjunct(conjunct, value))
          return false;
        else
          return true;
      });
      
      return ret;
    }
    DB.prototype._evalRow=function(subject, predicate, row){
      return this._testPredicate(predicate, row.data[subject])
    }
    DB.prototype._getIndexed=function(subject, predicate, zit){
      var _this=this, _ref, funct, cache=[]
      ;
	  
	  if (this.indexing.index[subject]){ /* Indexing for this subject exists. */
	  	predicate.forEach(function(predicateBit){
	  	  for (fn in _this.indexing.index[subject]) {
	  	  	if (fn.search(/^__/)!==-1) continue;
	  	  	
	  	    cache = cache.concat(
	  	      _this.indexing.index[subject][fn].get( predicateBit[fn] ).filter(function(row){
	  	      	return row.__zit__==zit;
	  	      })
			);
	  	  }
	  	 
	  	});
	  }
    	
      return cache;
    }
    DB.prototype._initialMatches=function(complex,instance){
      var _this=this
      ,matches=[], zit, _i
      ;
      
      for (_i in complex){ /* Foreach subject examine predicates and extract indexed properties. */
      	matches = this._getIndexed(_i, complex[_i], zit);
      	zit=guid();
      	matches.forEach(function(row){
      		row.__zit__=zit;
      	});
      }
      
      return this.toArray().filter(function(row){
        return row.__selected__!=instance;
      });
    }
    DB.prototype._filterRows=function(subject,predicate,rows){
      var _this=this
      ;
      return rows.filter(function(row){
        var ret =_this._evalRow(subject, predicate, row);
        if (ret){
          return ret;
        }
      });
    }
    DB.prototype.where=function(query){
      var _this=this
      ,instance = guid()
      ;
     
      if (! query) {
        this.selected = this.toArray();return this;
      }

      query = this._normalizeQuery(query); 

      this.selected=[].concat.apply(
        []
        ,query.map(function(complex,i){ /* query = [complex || complex || complex] */
          complex = _this._normalizeComplex(complex);
          var matches=_this._initialMatches(complex, instance);
          
          for (var subject in complex){ /* complex = {subject: predicate, subject: predicate} */
            var predicate = complex[subject]; /* 4, [4], [4,3], [{isNumber:true, is:4}, 3] */
            matches = _this._filterRows(subject, predicate, matches);        
          }
          matches.forEach(function(row){
            row.__selected__=instance;
          });
          
          return matches;
        })
      ); /* concat */

      return this;
    }
    
    return DB;
  })();

  DB.test={
    is:function(v){
      return this.value==v;
    },
    be:function(v){
      return this.value===v; 
    },
    gt:function(n){
      return this.value > n;
    },
    lt:function(n){
      return this.value < n;
    },
    gte:function(n){
      return this.value >= n;
    },
    lte:function(n){
      return this.value <= n;
    },
    between:function(a,b){
      return a < this.value && this.value < b;
    },
    within:function(a,b){
      return a <= this.value && this.value <= b;
    },
    isNumber:function(v){
      return (typeof this.value == 'number') === v;
    },
    isFunction:function(v){
      return (typeof this.value == 'function') === v;
    },
    isUndefined:function(v){
      return (typeof this.value == 'undefined') === v;
    },
    isString:function(v){
      return (typeof this.value == 'string') === v;
    }
  }

  var Row=(function(){
    __extends(Row, ListItem);
    function Row(d){
      Row.__super__.constructor.call(this,d);
    }
    return Row;
  })();
  
  var Indexing=(function(){
    function Indexing(b){
      this.base=b;
      
      this.index={};
    }
    
    Indexing.prototype.index=null;
    
    
    Indexing.prototype.setIndex=function(subject, fn){
      var _this=this
      ;
      
      if (! Indexing.test[fn])
        throw 'Index not defined.';
        
      
      if (! this.index[subject])
      	this.index[subject]={__length__:0};
      	
      if (! this.index[subject][fn]){
        this.index[subject][fn] = new Indexing.test[fn](guid());
        this.index[subject].__length__++;
      }

	  var indexObject;
	  indexObject = this.index[subject][fn];

      var rows=this.base.toArray();
      rows.forEach(function(row){
      	var val;
      	if (! (val=row.data[subject]))
      	  return;        
        
        indexObject.set(row, val);
      });
    }
    Indexing.prototype.unsetIndex=function(subject, fn){
      var _this=this
      ;
      
      if (! Indexing.test[fn])
        throw 'Index not defined.';
              
      if (! (this.index[subject] && this.index[subject][fn]))
        return false;

	  var rows = this.base.toArray();
	  
	  rows.forEach(function(row){
	  	if (typeof row.data[subject] == 'undefined')
	  	  return;
	  	  
	  	_this.index[subject][fn].unset(row);
	  });
	  
	  delete this.index[subject][fn];
	  this.index[subject].__length__--;
	  if (this.index[subject].__length__==0)
	    delete this.index[subject];
    }
    Indexing.prototype.update=function(row,subject,value,oldVal){
    	oldVal = typeof oldVal!='undefined' ? oldVal : row.data[subject];
    	
    	if (oldVal===value)
    	  return false;
    	
    	if (! this.index[subject])
    	  throw 'Non existing subject.';
    	
    	var fn;
    	for (fn in this.index[subject]) {
    	  if (fn.search(/^__/)!==-1) continue;
    	  
    	  this.index[subject][fn].unset(row);
    	  this.index[subject][fn].set(row, value);
    	}
    }
    Indexing.prototype.insert=function(row, subject){
    	if (! this.index[subject])
    	  throw 'Non existing subject.';
    	
    	for (var fn in this.index[subject]) {
    	  if (fn.search(/^__/)!==-1) continue;
    	  
    	  this.index[subject][fn].set(row, row.data[subject]);
    	}
    }
    
    return Indexing;
  })();
  
  var IndexObject;
  IndexObject=(function(){
  	function IndexObject(g){
  	  this.guid='__' + g + '__';
  	}
  	IndexObject.prototype.guid=null;
  	IndexObject.prototype.refArray='__' + guid() + '__';
  	IndexObject.prototype.refIndex='__' + guid() + '__';
  	IndexObject.prototype.set=function(){}
  	IndexObject.prototype.unset=function(row){}
  	IndexObject.prototype.get=function(){}
  	return IndexObject;
  })();
  
  Indexing.test={
  	is: (function(){
  		__extends(is, IndexObject);
  		function is(g){
  		  is.__super__.constructor.call(this,g);
  		  this.cache={};
  		}
  		is.prototype.cache=null;
  		is.prototype.refName='__' + guid() + '__';
  		is.prototype.set=function(row, val){
   		  if (! this.cache[val])
   		    this.cache[val]=[];
   		  
   		  this.cache[val].push(row);
   		  var index;
   		  index = this.cache[val].length-1;
   		  
   		  row[this.guid + this.refArray] = this.cache[val];
   		  row[this.guid + this.refIndex] = index;
   		  row[this.guid + this.refName] = val;
   		  
  		}
  		is.prototype.unset=function(row){
  		  var col;
  		  if (! (col = row[this.guid + this.refArray]))
	  	    return false;
	  	  
	  	  index = row[this.guid + this.refIndex];
	  	  
	  	  col.splice(index,1);
	  	  
	  	  delete row[this.guid + this.refArray];
	  	  delete row[this.guid + this.refIndex];
  		  
  		  if (col.length==0)
  		    delete this.cache[row[this.guid + this.refName]];
  		  delete row[this.guid + this.refName];
  		}
  		is.prototype.get=function(val){
  		  return this.cache[val];
  		}
  		
  		return is;
  	})()
  };
  
  
  function guid(){
    return _guid++;
  }
    
  
  module.exports={
    DB:DB,
    Row:Row,
    Indexing:Indexing,
    IndexObject:IndexObject
  }
  if (! isCommonJS)
    for (var _i in module.exports)
      window[_i] = module.exports[_i];  
})();
