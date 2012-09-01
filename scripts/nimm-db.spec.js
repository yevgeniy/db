var DB = require('./scripts/nimm-db.js').DB;
var Row = require('./scripts/nimm-db.js').Row;
var Indexing = require('./scripts/nimm-db.js').Indexing;
var IndexingType = require('./scripts/nimm-db.js').IndexingType;



describe('DB', function(){
  var db;
  beforeEach(function(){
    db = new DB();
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
    it('...normalize conjunct is called', function(){
      spyOn(db, '_normalizeConjunct')
      db._testPredicate( [4], 4 );
      expect(db._normalizeConjunct).toHaveBeenCalled();
    })
    it('...single member test', function(){
      expect(db._testPredicate( [4], 4 )).toBe(true);
    });
    it('...multi member test', function(){
      expect(db._testPredicate( [4,5], 4 )).toBe(true);
    });
  });
  describe('normalize-predicate', function(){
    it('...single entry, returns array', function(){
      var res = db._normalizePredicate(4);
      expect(res[0]).toBe(4);
    });
    it('...array entry, return same array', function(){
      var args;
      var res = db._normalizePredicate(args = [4]);
      expect(res).toBe(args);
    })
  });
  describe('eval-row', function(){
    it('...1 member row', function(){
      var r1 = new Row({foo:1});
      expect(db._evalRow('foo', [1], r1)).toBe(true);
      expect(db._evalRow('foo', [2], r1)).toBe(false);
    });
    it('...undefined subjects', function(){
      var r1 = new Row({foo:1});
      expect(db._evalRow('boo', [123], r1)).toBe(false);
    });
    it('...match second', function(){
      var r1 = new Row({foo:2, boo:'hi'});
      expect(db._evalRow('foo', [1,2], r1)).toBe(true);
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
        rows = db._filterRows('foo', [1,2], rows);
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
        return data.id;
      })
    ).selectFirst('skills');
    
    expect(set).toBe(ss1);
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
    // it('...set correctly',function(){
//       
      // indexing.setIndex('class',IndexingType.STRING_INDEX);
    // });
  });
  describe('_updateIndex...',function(){
    describe('string...',function(){
      it('...initial set',function(){
        indexing._updateIndex(db.first, 'class', db.first.data.class, IndexingType.STRING_INDEX);
        expect(indexing.index[IndexingType.STRING_INDEX]['class']).toBeDefined();
        expect(indexing.index[IndexingType.STRING_INDEX]['class']['soldier'][0]).toBe(db.first)
      });
      it('...initial set, row index-ref is set',function(){
        indexing._updateIndex(db.first, 'class', db.first.data.class, IndexingType.STRING_INDEX);
        expect(db.first.__index__.class).toBe(0);
      });
      it('...when removed if no more members in collection, category is removed from index',function(){
        indexing._updateIndex(db.first, 'class', db.first.data.class, IndexingType.STRING_INDEX);
        expect(indexing.index[IndexingType.STRING_INDEX].class.soldier.length).toBe(1);
        
        indexing._updateIndex(db.first, 'class', 'knight', IndexingType.STRING_INDEX);
        expect(indexing.index[IndexingType.STRING_INDEX].class.soldier).toBeUndefined();
        expect(indexing.index[IndexingType.STRING_INDEX].class.knight.length).toBe(1);
      });
      it('...updating indexes, decraments collection members',function(){
        var row1=new Row({class:'mage'});
        var row2=new Row({class:'mage'});
        var row3=new Row({class:'mage'});
        
        indexing._updateIndex(row1, 'class', 'mage', IndexingType.STRING_INDEX);
        indexing._updateIndex(row2, 'class', 'mage', IndexingType.STRING_INDEX);
        indexing._updateIndex(row3, 'class', 'mage', IndexingType.STRING_INDEX);
        
        expect(row1.__index__.class).toBe(0);
        expect(row2.__index__.class).toBe(1);
        expect(row3.__index__.class).toBe(2);
        
        indexing._updateIndex(row1, 'class', 'battle-mage', IndexingType.STRING_INDEX);
        
        expect(row1.__index__.class).toBe(0);
        expect(row2.__index__.class).toBe(0);
        expect(row3.__index__.class).toBe(1);
        
      })
    });
  });
});