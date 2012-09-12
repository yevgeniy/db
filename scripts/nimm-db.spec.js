var DB = require('./scripts/nimm-db.js').DB;
var Row = require('./scripts/nimm-db.js').Row;
var Indexing = require('./scripts/nimm-db.js').Indexing;
var IndexObject = require('./scripts/nimm-db.js').IndexObject;



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
  describe('initial-matches', function(){
  	var complex;
  	beforeEach(function(){
  	  complex={class:[{is:'knight'}], race:[{is:'ork'}]};
  	});
  	it('...call get-indexed for each subject', function(){
  	  spyOn(db, '_getIndexed').andCallThrough();
  		
  	  db._initialMatches(complex, 1);
  	  
	  expect(db._getIndexed.argsForCall.length).toBe(2);
  	})
  	it('...call get-indexed with first zit of undefined', function(){
  	  spyOn(db, '_getIndexed').andCallThrough();
  	  
  	  db._initialMatches(complex, 1);
  	  
	  expect(db._getIndexed.argsForCall[0][2]).toBeUndefined();
  	})
  	it('...zit each object return from get-indexed', function(){
  		var o1={}, o2={}
  		db._getIndexed=function(){return[o1,o2]};
  		
  		db._initialMatches(complex,1);
  		expect(o1.__zit__).toBeDefined();
  		expect(o2.__zit__).toBeDefined();
  		expect(o1.__zit__ === o2.__zit__).toBe(true);
  	})
  });
  // describe('get-indexed', function(){
  	// var subject, predicate;
  	// beforeEach(function(){
  	  // subject='class';
//   	  
  	  // predicate=[{is:'knight', isLeader:true}, {is:'wizzard', isAlive:true}]
//   	  
  	  // db.indexing.setIndex('class', IndexingType.STRING)
  	  // db.insert([
  	  	// {class:'ninja', race:'human'},
  	  	// {class:'wizzard', race:'ork'},
  	  	// {class:'knight', race:'human'}
  	  // ]);
  	// })
  	// it('...', function(){
  		// db._getIndexed(subject, predicate);
  	// })
  // })
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
	  db.indexing.setIndex('class', 'is');
  		
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
	  db.indexing.setIndex('class', 'is');

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
      expect(db.indexing.update.argsForCall[0][3]).toBe('soldier');
      
      expect(db.indexing.update.argsForCall[1][0]).toBe(db.first.next);
      expect(db.indexing.update.argsForCall[1][1]).toBe('class');
      expect(db.indexing.update.argsForCall[1][2]).toBe('lord');
      expect(db.indexing.update.argsForCall[1][3]).toBe('wizzard');
  	});
  });
})
 
describe('Indexing...',function(){
  var indexing,db,row, ib;
  beforeEach(function(){
    db=new DB();
    db.insert([
      {id:1, class:'soldier', race:'ork'},
      {id:2, class:'wizzard', race:'elf'},
      {id:2, area:'rock', elevation:12},
    ]);
    indexing=new Indexing(db);

	ib = Indexing.test.is;
    Indexing.test.is=IndexObject;
  });
  afterEach(function(){
  	Indexing.test.is=ib;
  })
  describe('setIndex...',function(){
  	it('...throw if index not defined.', function(){
  		expect(function(){
  			indexing.setIndex('class', 'foo');
  		}).toThrow('Index not defined.');
  	})
  	it('...if subject not yet referenced on index, create it', function(){
  		indexing.setIndex('class', 'is');
  		
  		expect(indexing.index.class.is).toBeDefined();
  		expect(indexing.index.class.__length__).toBe(1);
  	})
  	it('...index-object called on all rows where-in subject is found', function(){
  		var io = new IndexObject(12345);
  		indexing.index={
  			class:{
  				is:io
  			}
  		}
  		spyOn(io, 'set');
  		
  		indexing.setIndex('class', 'is');
  		
  		expect(io.set.argsForCall.length).toBe(2);
  		
  		expect(io.set.argsForCall[0][0]).toBe(db.first);
  		expect(io.set.argsForCall[0][1]).toBe('soldier');
  		
  		expect(io.set.argsForCall[1][0]).toBe(db.first.next);
  		expect(io.set.argsForCall[1][1]).toBe('wizzard');
  	});
  });
  describe('unset-index', function(){
  	it('...throws if index not set', function(){
		expect(function(){
			indexing.unsetIndex('class', 'foo');
		}).toThrow('Index not defined.');
  	});
  	it('...return false if subject and/or function not set', function(){
  		expect(indexing.unsetIndex('class', 'is')).toBe(false);
  	})
  	it('...call unset on each applicable row', function(){
  		var io = new IndexObject(12345);
  		indexing.index={
  			class:{
  				is:io
  			}
  		}
  		spyOn(io, 'unset');
  		
  		indexing.unsetIndex('class', 'is')
  		
		expect(io.unset.argsForCall.length).toBe(2);
  		expect(io.unset.argsForCall[0][0]).toBe(db.first);
  		expect(io.unset.argsForCall[1][0]).toBe(db.first.next);
  	});
  	it('...delete index-object after unsetting', function(){
  		var io = new IndexObject(12345);
  		var io2 = new IndexObject(123456);
  		indexing.index={
  			class:{
  				is:io,
  				foo:io2,
  				__length__:2
  			}
  		}
  		
  		indexing.unsetIndex('class', 'is');
  		
  		expect(indexing.index.class.is).toBeUndefined();
  		expect(indexing.index.class.__length__).toBe(1)
  	})
  	it('...removes subject with 0 length', function(){
  		var io = new IndexObject(12345);
  		indexing.index={
  			class:{
  				is:io,
  				__length__:1
  			}
  		}
  		
  		indexing.unsetIndex('class', 'is');
  		
  		expect(indexing.index.class).toBeUndefined();
  	})
  	
  });
  describe('update...',function(){
  	var row, io;
  	beforeEach(function(){
  	  row = db.first;
	  io = new IndexObject(12345);
	  io2 = new IndexObject(54321);
  	  indexing.index={
  	    class:{
  	      is:io,
  	      foo:io2
  		}
  	  }
  	});
  	it('...old and new values equal return false', function(){
  		expect(indexing.update(new Row(), 'foo', 1, 1)).toBe(false);
  	});
  	it('...throw if subject does not exist in index', function(){
  		indexing.index={}
  		expect(function(){
  		  indexing.update(row, 'class', 'lord', 'soldier')
  		}).toThrow('Non existing subject.');
  	})
  	it('...foreach indexing-object expect unset and set to be called on this row', function(){
  		spyOn(io,'set');
  		spyOn(io,'unset');
  		spyOn(io2,'set');
  		spyOn(io2,'unset');
  		
  		indexing.update(row, 'class', 'lancer', 'solder');
  		
  		expect(io.unset).toHaveBeenCalledWith(row)
  		expect(io.set).toHaveBeenCalledWith(row, 'lancer')
  		
  		expect(io2.unset).toHaveBeenCalledWith(row)
  		expect(io2.set).toHaveBeenCalledWith(row, 'lancer')
  	});
  });
  describe('insert...', function(){
	var row, io;
  	beforeEach(function(){
  	  row = db.first;
	  io = new IndexObject(12345);
	  io2 = new IndexObject(54321);
  	  indexing.index={
  	    class:{
  	      is:io,
  	      foo:io2
  		}
  	  }
  	});
  	it('...throw if subject does not exist on index', function(){
  		expect(function(){
  			indexing.insert(db.first, 'foo');
  		}).toThrow('Non existing subject.');
  	})
  	it('...foreach function in index-subject call set', function(){
  		spyOn(io,'set');
  		spyOn(io2,'set');
  		
  		indexing.insert(row, 'class');
  		expect(io.set).toHaveBeenCalledWith(row, 'soldier')
  		expect(io2.set).toHaveBeenCalledWith(row, 'soldier')
  	})
  })
  
});

/*
 * INDEXING TESTS
 */
describe('is',function(){
  var io, row, db, row2;
  beforeEach(function(){
    io = new Indexing.test.is(1234);
    db=new DB();
    db.insert([
  	  {id:1, class:'soldier', race:'ork'},
  	  {id:2, class:'soldier', race:'elf'}
    ]);
    row = db.first;
    row2 = db.first.next;
  });
  
  describe('set...', function(){
    it('...row placed into cache-value', function(){
  	  io.set(row, 'soldier');
	  expect(io.cache.soldier).toBeDefined();
	  expect(io.cache.soldier[0]).toBe(row);
 	})
 	it('...references from row are set', function(){
 	  io.set(row, 'soldier');
 	  expect(row[io.guid + io.refArray]).toBe(io.cache.soldier)
 	  expect(row[io.guid + io.refIndex]).toBe(io.cache.soldier.length-1)
 	  expect(row[io.guid + io.refName]).toBe('soldier');
 	})
  });
  describe('unset...', function(){
  	beforeEach(function(){
  	  io.set(row, 'soldier');
  	  io.set(row2, 'soldier');
  	})
  	it('...if collection not found returns false', function(){
  	  delete row[io.guid + io.refArray];
  	  expect(io.unset(row)).toBe(false);
  	})
  	it('...removes row from collection', function(){
  	  io.unset(row);
  	  expect(io.cache.soldier.length).toBe(1);
  	  
  	  io.unset(row2);
  	  expect(io.cache.solder).toBeUndefined();
  	})
  	it('...delete name, index, and col', function(){
  	  io.unset(row);
  	  
  	  expect(row[io.guid + io.refName]).toBeUndefined();
  	  expect(row[io.guid + io.refArray]).toBeUndefined();
  	  expect(row[io.guid + io.refIndex]).toBeUndefined();
  	});
  })
});