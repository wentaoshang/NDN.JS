var NdnsPolicy = new IdentityPolicy(
    // anchors
    [
{ key_name: new Name("/ndn/keys/ucla.edu/alex/%C1.M.K%00F%8D%E9%C3%EE4%7F%C1Mjqro%C6L%8DGV%91%90%03%24%ECt%95n%F3%9E%A6i%F1%C9"), 
  namespace: new Name("/"),
  key: Key.createFromPEM({ pub: "-----BEGIN PUBLIC KEY-----\n" +
			   "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDSPdPM7+DjDcUGHtwEDmkq4kO5\n" +
			   "tEUI05w5gR4JC1UiZxS0ckMWSLRPWXozHrpJsjNzDeI6OiQrXzup1tF2IN+Xtdr+\n" +
			   "Pr3CwyBRloTJJbm5kf+pGuJh4fE9Qk0i/fS9Xs6gFup3oPnr+wFFjJObnRTrUsaM\n" +
			   "8TQokOLYZFsatsZOvwIDAQAB\n" +
			   "-----END PUBLIC KEY-----" }) }
	],
    // rules
    [
{ key_pat: new RegExp("^((?:/[^/]+)*)/DNS((?:/[^/]+)*)/[^/]+/NDNCERT$"), 
  key_pat_ext: "$1$2", 
  data_pat: RegExp("^((?:/[^/]+)*)/DNS((?:/[^/]+)*)$"), 
  data_pat_ext: "$1$2" },
  
{ key_pat: new RegExp("^((?:/[^/]+)*)/DNS((?:/[^/]+)*)/[^/]+/NDNCERT$"), 
  key_pat_ext: "$1$2",
  data_pat: RegExp("^((?:/[^/]+)*)/([^/\.]+)\.([^/\.]+)/DNS((?:/[^/]+)*)$"), 
  data_pat_ext: "$1/$3/$2$4" },

{ key_pat: new RegExp("^((?:/[^/]+)*)/DNS((?:/[^/]+)*)/[^/]+/NDNCERT$"), 
  key_pat_ext: "$1$2", 
  data_pat: /(.*)/, 
  data_pat_ext: "$1" }
	]
    );

function testPolicy () {
    var onData = function (interest, co) {
	console.log('Data name: ' + co.name.to_uri());
	
	NdnsPolicy.verify(co, function (result) {
		if (result == VerifyResult.SUCCESS) {
		    console.log('Content: \n' + co.to_xml());
		} else if (result == VerifyResult.FAILURE)
		    console.log('Verification failed.');
		else if (result == VerifyResult.TIMEOUT)
		    console.log('Verification failed due to timeout.');
		
		ndn.close();
	    });
    };

    var onTimeout = function (interest) {
        console.log("Interest time out.");
        console.log('Interest name: ' + interest.name.to_uri());
        ndn.close();
    };

    
    var ndn = new NDN();
    
    ndn.onopen = function () {
        var n = new Name('/ndn/ucla.edu/DNS/NS');
        var template = new Interest();
        template.interestLifetime = 4000;
        ndn.expressInterest(n, template, onData, onTimeout);
    };
    
    ndn.connect();
}
