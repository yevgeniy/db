var DB = require('./scripts/nimm-db.js').DB;
var Row = require('./scripts/nimm-db.js').Row;
var Indexing = require('./scripts/nimm-db.js').Indexing;
var IndexingType = require('./scripts/nimm-db.js').IndexingType;



describe('DB', function(){
  var db;
  beforeEach(function(){
    db = new DB();
  })
  describe('normalize-complex', function(){
    var complex;
    beforeEach(function(){
      complex1 = {class:'knight', lvl:17, hit:{isFunction:true}};
    })
    it('...calls noramilze-predicate on all subject predicates', function(){
      spyOn(db, '_normalizePredicate');
      db._normalizeComplex(complex1);
      
      expect(db._normalizePredicate.argsForCall.length).toBe(3); 
    })
  })
  it('...normalize-query returns array', function(){
    var q = {foo:1};
    var res = db._normalizeQuery(q);
    expect(res[0]).toBe(q);
  });
  it('...given a single value should return correct test', function(){
      var res = db._normalizeConjunct(4);
      
      expect(res.is).toBeDefined()
      expect(res.is).toBe(4);
  })
  describe('test-conjunct', function(){
    it('...throws error if test does not exist', function(){
      expect(function(){
        db._testConjunct({foo:4},4);
      }).toThrow("test 'foo' does not exist");
    })
    it('...single test', function(){
      expect(db._testConjunct({is:4}, 2)).toBe(false);
      expect(db._testConjunct({is:4}, 4)).toBe(true);
    });
    it('...multi test',function(){
      expect(db._testConjunct({is:4, isNumber:true}, 2)).toBe(false);
      
      DB.test.lt=function(n){
        return this.value < n;
      }
      
      expect(
        db._testConjunct( {isNumber:true, is:4, lt:5}, 4) 
      ).toBe(true);
      
      DB.test.between=function(x,y){
        return x < this.value && this.value < y;
      }
      
      expect(
       db._testConjunct({between:['a','c']},'b') 
      ).toBe(true)
    })
  })
  describe('test-predicate', function(){
    it('...single member test', function(){
      expect(db._testPredicate( [4], 4 )).toBe(true);
    });
    it('...multi member test', function(){
      expect(db._testPredicate( [4,5], 4 )).toBe(true);
    });
  });
  describe('normalize-predicate', function(){
    it('...single entry, returns normalized array', function(){
      var res = db._normalizePredicate(4);
      expect(res[0].is).toBe(4);
    });
    it('...expect normalize-conjunct to be called for each predicate member.', function(){
      var pred = ['foo', 4, 5];
      spyOn(db, '_normalizeConjunct');
      
      var c = db._normalizePredicate(pred);
            
      expect(db._normalizeConjunct.argsForCall.length).toBe(3);
      
      expect(db._normalizeConjunct.argsForCall[0][0]).toBe('foo');
      expect(db._normalizeConjunct.argsForCall[1][0]).toBe(4);
      expect(db._normalizeConjunct.argsForCall[2][0]).toBe(5);
    })
  });
  describe('eval-row', function(){
    it('...1 member row', function(){
      var r1 = new Row({foo:1});
      expect(db._evalRow('foo', [{is:1}], r1)).toBe(true);
      expect(db._evalRow('foo', [{is:2}], r1)).toBe(false);
    });
    it('...undefined subjects', function(){
      var r1 = new Row({foo:1});
      expect(db._evalRow('boo', [{is:123}], r1)).toBe(false);
    });
    it('...match second', function(){
      var r1 = new Row({foo:2, boo:'hi'});
      expect(db._evalRow('foo', [{is:1},{is:2}], r1)).toBe(true);
    });
  });
  describe('filter-rows', function(){
    var rows,r1,r2,r3;
    beforeEach(function(){
      rows=[
        r1=new Row({foo:1}),
        r2=new Row({foo:2, boo:'hi'}),
        r3=new Row({foo:3, woo:'hello world'})
      ];
    })
    it('...match one', function(){
        rows = db._filterRows('foo', [1], rows);
        expect(rows[0]).toBe(r1)
    });
    it('...match two', function(){
        rows = db._filterRows('foo', [{is:1},{is:2}], rows);
        expect(rows[0]).toBe(r1)
        expect(rows[1]).toBe(r2)
        expect(rows[2]).toBe(undefined);
    });
  })
  it('...where',function(){
    var r1 = new Row({class:'wizard', race:'human'});
    var r2 = new Row({class:'knight', race:'human'});
    var r3 = new Row({lvl:30, race:'human'});
    
    db.insert([r1,r2,r3]);
    
    db.where([
      {class:'knight'},
      {lvl:{gte:13}, race:'human'}
    ]);
    
    expect(db.selected[0].data).toBe(r2.data);
    expect(db.selected[1].data).toBe(r3.data);
  });

  it('...select', function(){
    var chars = new DB();
    chars.insert([
      {id:1, class:'knight'},
      {id:2, class:'wizzard'}
    ]);
    
    var skills = new DB();
    var ss1=[1,2,3,4,5];
    var ss2=[11,22,33,44,55];
    skills.insert([
      {id:1, skills:ss1},
      {id:2, skills:ss2}
    ]);
    
    var set = 
    skills.where( 
      chars.where({class:'wizzard'}).select(function(data){
        return {id:data.id};
      })
    ).selectFirst('skills');
    
    expect(set).toBe(ss2);
  });
  
  it('...update', function(){
    db.insert([
      {id:1, class:'soldier', race:'ork'},
      {id:2, class:'wizzard', race:'elf'},
    ]);
    
    db.where({id:1}).update({class:'barbarian'});
    
    expect(db.first.data.class).toBe('barbarian');
    expect(db.last.data.class).toBe('wizzard');
  })
  describe('insert...',function(){
  	it('...new indexing created for each row', function(){
	  db.indexing.setIndex('class', IndexingType.STRING);
  		
  	  spyOn(db.indexing, 'insert');
  		
  	  db.insert([
	    {id:1, class:'soldier', race:'ork'},
	    {id:2, class:'wizzard', race:'elf'},	
  	  ]);
  	  
  	  expect(db.indexing.insert.argsForCall[0]).toBeDefined();
  	  expect(db.indexing.insert.argsForCall[1]).toBeDefined();
  	  
  	  expect(db.indexing.insert.argsForCall[0][0]).toBe(db.first);
  	  expect(db.indexing.insert.argsForCall[0][1]).toBe('class');
  	  
  	  expect(db.indexing.insert.argsForCall[1][0]).toBe(db.first.next);
  	  expect(db.indexing.insert.argsForCall[0][1]).toBe('class');
  	  
  	});
  });
  describe('update...',function(){
  	it('...value updated for each row', function(){
	  db.indexing.setIndex('class', IndexingType.STRING);

	  spyOn(db.indexing, 'update');

	  db.insert([
        {id:1, class:'soldier', race:'ork'},
        {id:2, class:'wizzard', race:'elf'},	
      ]);
      
      db.update({
      	class:'lord'
      });
      
      expect(db.indexing.update.argsForCall[0]).toBeDefined();
      expect(db.indexing.update.argsForCall[1]).toBeDefined();
      
      expect(db.indexing.update.argsForCall[0][0]).toBe(db.first);
      expect(db.indexing.update.argsForCall[0][1]).toBe('class');
      expect(db.indexing.update.argsForCall[0][2]).toBe('lord');
      
      expect(db.indexing.update.argsForCall[1][0]).toBe(db.first.next);
      expect(db.indexing.update.argsForCall[1][1]).toBe('class');
      expect(db.indexing.update.argsForCall[1][2]).toBe('lord');
  	});
  });
})

describe('Indexing...',function(){
  var indexing,db,row;
  beforeEach(function(){
    db=new DB();
    db.insert([
      {id:1, class:'soldier', race:'ork'},
      {id:2, class:'wizzard', race:'elf'},
    ]);
    indexing=new Indexing(db);
    
    row=new Row();
  });
  describe('setIndex...',function(){
    beforeEach(function(){
      indexing._updateIndex=function(){};
    });
    it('...returns false if index already set.',function(){
      indexing.index.foo={
        'string':{}
      };
      
      expect(indexing.setIndex('foo', 'string')).toBe(false);
    });
    it('...returns true if index set.',function(){
      expect(indexing.setIndex('foo', 'string')).toBe(true);
    })
    it('...calls update-index', function(){
      spyOn(indexing, '_updateIndex');
      indexing.setIndex('class', IndexingType.STRING);
      expect(indexing._updateIndex).toHaveBeenCalled();
    });
    it('...calls update-index for each row', function(){
      spyOn(indexing, '_updateIndex');
      indexing.setIndex('class', IndexingType.STRING);
      expect(indexing._updateIndex.argsForCall.length).toBe(2);
      
      expect(indexing._updateIndex.argsForCall[0][1].data.class).toEqual('soldier');
      expect(indexing._updateIndex.argsForCall[1][1].data.class).toEqual('wizzard');
    })
  });
  describe('unsetIndex', function(){
  	beforeEach(function(){
	  indexing.setIndex('class', IndexingType.STRING);
  	});
  	it('...if not indexed return false', function(){
	  expect(indexing.unsetIndex('race', IndexingType.STRING)).toBe(false);
  	})
  	it('...clears index on row', function(){
	  indexing.unsetIndex('class', IndexingType.STRING);

  	  expect(db.first.__index__).toBeUndefined();
  	  expect(db.first.next.__index__).toBeUndefined();
  	})
  	it('...clears index in indexing', function(){
	  indexing.unsetIndex('class', IndexingType.STRING);
  		
	  expect(indexing.index.class).toBeUndefined();
  	});
  	
  });
  describe('update...',function(){
  	beforeEach(function(){
	  indexing.setIndex('class', IndexingType.STRING);
  	});
  	it('...throws error if subject does not exist', function(){
  		expect(function(){
  			indexing.update(db.first, 'race', 'ork')
  		}).toThrow('Non existing subject.');
  	});
  	it('...updating row subject results in correct, return index, and indexing system.', function(){
  		var row = db.first;
  		indexing.update(row, 'class', 'fighter');
  		
  		
  		expect(indexing.index.class[IndexingType.STRING].soldier).toBeUndefined();
  		expect(indexing.index.class[IndexingType.STRING].fighter).toBeDefined();
  		expect(indexing.index.class[IndexingType.STRING].fighter.length).toBe(1);
  		
  		expect(row.__index__.class[IndexingType.STRING]).toBe(0);
  	});
  });
  describe('_updateIndex...',function(){
    describe('string...',function(){
      it('...initial set',function(){
        indexing._updateIndex(IndexingType.STRING_INDEX, db.first, 'class', db.first.data.class);
        expect(indexing.index['class'][IndexingType.STRING_INDEX]).toBeDefined();
        expect(indexing.index['class'][IndexingType.STRING_INDEX]['soldier'][0]).toBe(db.first)
      });
      it('...initial set, row index-ref is set',function(){
        indexing._updateIndex(IndexingType.STRING_INDEX, db.first, 'class', db.first.data.class);
        expect(db.first.__index__.class[IndexingType.STRING]).toBe(0);
      });
      it('...when removed if no more members in collection, category is removed from index',function(){
        indexing._updateIndex(IndexingType.STRING_INDEX, db.first, 'class', db.first.data.class);
        expect(indexing.index.class[IndexingType.STRING_INDEX].soldier.length).toBe(1);
        
        indexing._updateIndex(IndexingType.STRING_INDEX, db.first, 'class', 'knight', db.first.data.class);
        
        expect(indexing.index.class[IndexingType.STRING_INDEX].soldier).toBeUndefined();
        expect(indexing.index.class[IndexingType.STRING_INDEX].knight.length).toBe(1);
      });
      it('...updating indexes, decraments collection members',function(){
        var row1=new Row({class:'mage'});
        var row2=new Row({class:'mage'});
        var row3=new Row({class:'mage'});
        
        indexing._updateIndex(IndexingType.STRING_INDEX, row1, 'class', 'mage');
        indexing._updateIndex(IndexingType.STRING_INDEX, row2, 'class', 'mage');
        indexing._updateIndex(IndexingType.STRING_INDEX, row3, 'class', 'mage');
        
        expect(row1.__index__.class[IndexingType.STRING_INDEX]).toBe(0);
        expect(row2.__index__.class[IndexingType.STRING_INDEX]).toBe(1);
        expect(row3.__index__.class[IndexingType.STRING_INDEX]).toBe(2);
        
        indexing._updateIndex(IndexingType.STRING_INDEX, row1, 'class', 'battle-mage', 'mage');
        
        expect(row1.__index__.class[IndexingType.STRING]).toBe(0);
        expect(row2.__index__.class[IndexingType.STRING]).toBe(0);
        expect(row3.__index__.class[IndexingType.STRING]).toBe(1);
        
      })
    });
  });
});
