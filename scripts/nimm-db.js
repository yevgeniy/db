(function(){
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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
      
      this.indexing=new Indexing();
    }
    
    DB.prototype.effected=null;
    DB.prototype.selected=null;
    DB.prototype.indexing=null;
    
    DB.prototype.push=function(d){
      var i
      ,row = this._push(new Row(d))
      ;
      
      // for(i in row.data)
          // this._updateIndex(row,i,row.data[i]);
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
        
        _this.effected.push(item);
      });

      return this;
    }
    DB.prototype._updateRowSubject=function(row, subject, newValue){
      if (subject)
        if (row.data[subject]!==newValue){
          row.data[subject]=newValue;
          // this._updateIndex(row,subject,row.data[subject]);
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
    DB.prototype._normalizePredicate=function(predicate){
      if (predicate instanceof Array)
        return predicate;
      else
        return [predicate];
        
    }
    DB.prototype._testPredicate=function(predicate, value){
      var _this = this
      ,ret=false
      ;
      
      predicate.every(function(conjunct){
        conjunct = _this._normalizeConjunct(conjunct);
        
        if (ret = _this._testConjunct(conjunct, value)){
          return false;
        } else
          return true;
      });
      
      return ret;
    }
    DB.prototype._evalRow=function(subject, predicate, row){
      return this._testPredicate(predicate, row.data[subject])
    }
    DB.prototype._initialMatches=function(complex,instance){
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
     
      query = this._normalizeQuery(query); 

      this.selected=[].concat.apply(
        []
        ,query.map(function(complex,i){ /* query = [complex || complex || complex] */
          var matches=_this._initialMatches(complex, instance);
          
          for (var subject in complex){ /* complex = {subject: predicate, subject: predicate} */
            var predicate = _this._normalizePredicate( complex[subject] ); /* 4, [4], [4,3], [{isNumber:true, is:4}, 3] */
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
  var IndexingType=(function(){
    function IndexingType(){}
    IndexingType.STRING_INDEX = IndexingType.STRING = 'string-index';
    IndexingType.NUMBER_INDEX = IndexingType.NUMBER = 'number-index';
    IndexingType.RANGE_INDEX = IndexingType.RANGE = 'range-index';
    return IndexingType;
  })();
  var Indexing=(function(){
    function Indexing(b){
      this.base=b;
      
      this.index={};
      this.index[IndexingType.STRING]={};
      this.index[IndexingType.NUMBER]={};
      this.index[IndexingType.RANGE]={};
    }
    
    Indexing.prototype.index=null;
    
    Indexing.prototype.setIndex=function(subject, type){
      var _this=this
      ;
      if (! this.index[type][subject])
        this.index[type][subject]={};
      else 
        return false; /* Index already exists no need to parse. */

      var rows=this.base.where().selected;
      rows.forEach(function(row){
        _this._updateIndex(row,subject,row.data[subject],type);
      });

      return true;
    }
    Indexing.prototype._updateIndex=function(type,row,subject,value,oldVal){
      var _this=this;
      switch(type){
        case IndexingType.STRING_INDEX:
          string(type,row,subject,value,oldVal);break;
        case IndexingType.NUMBER_INDEX:
          number(type,row,subject,value,oldVal);break;
        case IndexingType.RANGE_INDEX:
          range(type,row,subject,value,oldVal);break;
      }
      function string(type,row,subject,value,oldVal){
        var index,oldVal;
        if (  typeof oldVal != 'undefined' && 
              row.__index__ && 
              typeof (index=row.__index__[subject]) != 'undefined' ){ /* Rid the old index. */
          
          if (typeof _this.index[type][subject][oldVal] == 'undefined') /* Ensure old value is valid. */
            throw 'Old value not found in index.';
            
          _this.index[type][subject][oldVal].splice(index,1);
          
          for (var i=index; i < _this.index[type][subject][oldVal].length; i++) /* Update subsequent back-references in collection. */
            _this.index[type][subject][oldVal][i].__index__[subject]=i;
          
          if (_this.index[type][subject][oldVal].length==0) /* Remove possible empty indexing block. */
            delete _this.index[type][subject][oldVal];
            
          if (typeof value == 'undefined') /* Removed undefined subjects from row back-references. */
            delete row.__index__[subject];          
        }
        
        if (typeof value != 'string')
          return;
        
        if (! _this.index[type][subject]) /* Insert new index record. */
          _this.index[type][subject]={};
        if (! _this.index[type][subject][value])
          _this.index[type][subject][value]=[];
        _this.index[type][subject][value].push(row);

        if (! row.__index__) /* Back reference from row. */
          row.__index__={};
        row.__index__[subject] = _this.index[type][subject][value].length-1;
      }
      function number(type,row,subject,value,oldVal){
        var index;
        if (row.__index__ && typeof (index=row.__index__[subject]) != 'undefined' ){ /* Rid the old index. */
          _this.index[type][subject][row.data[subject]].splice(index,1); /* Still old value in row. */
          
          for (var i=index; i < _this.index[type][subject][row.data[subject]].length; i++) /* Update subsequent back-references in collection. */
            _this.index[type][subject][row.data[subject]][i].__index__[subject]=i;
          
          if (_this.index[type][subject][row.data[subject]].length==0) /* Remove possible empty indexing block. */
            delete _this.index[type][subject][row.data[subject]];          
        }
        
        if (typeof value != 'number')
          return;
        
        if (! _this.index[type][subject]) /* Insert new index record. */
          _this.index[type][subject]={};
        if (! _this.index[type][subject][value])
          _this.index[type][subject][value]=[];
        _this.index[type][subject][value].push(row);

        if (! row.__index__) /* Back reference from row. */
          row.__index__={};
        row.__index__[subject]= _this.index[type][subject][value].length-1;
      }
      function range(type,row,subject,value,oldVal){
        
      }
    }
    
    return Indexing;
  })()
  
  function guid() {
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    function S4() {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }
  }
    
  module.exports={
    DB:DB,
    Row:Row,
    Indexing:Indexing,
    IndexingType:IndexingType
  }  
})();
