
import {ANN_Client} from '../index';
import {Observable} from "rxjs";

describe('Testing the ANN api client', function () {
  this.timeout(15000);



  describe('This tests the API backoff', function () {
    it('Run two requests immediately that are called 10 seconds apart', function (done) {
      let ops = {apiBackOff: 10, caching:false};
      let ann = new ANN_Client(ops);
      let ar = ann.findTitlesLike(['good']);
      let br = ann.findTitlesLike(['bears']);

      let start = Date.now();
      Observable.forkJoin(ar,br)
        .subscribe(gb=>{
          let end = Date.now();
          let good = gb[0];
          let bears = gb[1];
          if(good && bears && good.length === bears.length)
            throw "results were the same";
          if(end - start < 10)
            throw "the api backoff did not wait 10 seconds";

          done();
        });
    });
  });


  describe('Test that the api has not changed', function () {
    it('it should return expected data for given title', function (done) {
        let ops = {apiBackOff: 10, caching:false, typeFilter:'anime'};
        let ann = new ANN_Client(ops);
        ann.findTitlesLike(['YU-NO: A girl who chants love at the bound of this world.'])
            .take(1)
            .subscribe((resp)=>{
                let res = resp[0];
                if(res.alternativeTitles[0] !== "kono yo no hate de koi o utau shōjo yu-no")
                    throw new Error('alt title 0 was incorrect');
                if(res.alternativeTitles[1] !== "この世の果てで恋を唄う少女yu-no")
                    throw new Error('alt title 1 was incorrect');
                if(res.dateEnded.getDate() !== 31)
                    throw new Error('dateEnded was incorrect');
                if(res.dateReleased.getDate() !== 31)
                    throw new Error('dateReleased was incorrect');
                if(res.occurrence !== 0)
                    throw new Error('occurrence was incorrect');
                if(res.title !== 'YU-NO: A girl who chants love at the bound of this world.')
                    throw new Error('title was incorrect');
                if(res.type !== 'anime')
                    throw new Error('title was incorrect');
                if(res._id !== 'https://cdn.animenewsnetwork.com/encyclopedia/api.xml?anime=20479')
                    throw new Error('_id was incorrect');

                done();
            });
    });
  });
});
