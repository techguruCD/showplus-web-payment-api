import { Request, Response } from "express";
import crypto from 'crypto';
import axios from 'axios'
const request = require('request');

const getAuthUrl = (idc_name : string) => {
  const url = "stdpay.inicis.com/api/payAuth";
  
  let authUrl : string = "";
  switch (idc_name) {
    case "fc":
    authUrl = "https://fc" + url;
    break;
    case "ks":
    authUrl = "https://ks" + url;
    break ;
    case "stg":
    authUrl = "https://stg" + url;
    break;
    default:
    break;
  }
  return authUrl;
}
  
const getNetCancelUrl = (idc_name : string) => {
  const url = "stdpay.inicis.com/api/netCancel";
  
  let netCancel : string = "";
  switch (idc_name) {
    case 'fc':
    netCancel = "https://fc"+ url;
    break;
    case 'ks':
    netCancel = "https://ks"+ url;
    break;
    case 'stg':
    netCancel = "https://stg"+ url;
    break;
    default:
    break;
  }
  return netCancel;
}

export const returnUrl = async (req: Request, res: Response) => {
  if(req.body.resultCode === '0000' ) {
    console.log("===========   req.body.resultCode  0000  ================", JSON.stringify(req.body));
    const mid = req?.body?.mid ;
    const signKey = process.env.SIGNKEY;
    const authToken = req?.body?.authToken;
    const netCancelUrl = req?.body?.netCancelUrl;
    const merchantData = req.body?.merchantData;
    const timestamp = new Date().getTime();
    const charset = "UTF-8";
    const format = "JSON";

    const idc_name = req.body?.idc_name;
    const authUrl = req.body?.authUrl;
    const authUrl2 = getAuthUrl(idc_name);

    const signature = crypto.createHash("sha256").update("authToken=" + authToken + "&timestamp=" + timestamp).digest("hex");

    const verification = crypto.createHash("sha256").update("authToken=" + authToken + "&signKey=" + signKey + "&timestamp=" + timestamp).digest("hex");

    const options = {
      mid,
      authToken,
      timestamp,
      signature,
      verification,
      charset,
      format
    }

    if (authUrl == authUrl2) {
      request.post({method: 'POST', uri: authUrl2, form: options, json: true}, async (err: any,httpResponse: any,body: any) => {
        try {
          let jsoncode:string = (err) ? err : JSON.stringify(body);
          let result:any = JSON.parse(jsoncode);
          let candyValue : any = 0 ;
          if( result.resultCode === '0000' ) {
            const chargeUserId = Number(result.MOID.split(".")[0]);
            const productId = Number(result.MOID.split(".")[1]);
            const params = {
              chargeUserId,
              productId,
              MOID: result.MOID,
              CARD_PurchaseName: result?.CARD_PurchaseName, 
              payMethod: result?.payMethod,
            }
            const tempRes = await axios.post(process.env.SHOWPLUS_API_URL + "/api/web/payment/candyCharge", params);
            candyValue = tempRes.data.candyValue;
          }
          if ( result.resultCode === 'R201' ) {
            const params = {
              resultMsg: '정상처리되었습니다.',
              resultCode: '0000',
              candyValue
            }
            res.redirect(`/candyCharge/${JSON.stringify(params)}`)
          } else {
            const params = {
              resultMsg: result.resultMsg,
              resultCode: result.resultCode,
              candyValue
            }
            res.redirect(`/candyCharge/${JSON.stringify(params)}`)
          }
        } catch (err) {
          console.log(err);
          const netCancelUrl2 = getNetCancelUrl(idc_name)
          if(netCancelUrl == netCancelUrl2) {
            request.post({method: 'POST', uri: netCancelUrl2, form: options, json: true}, (err:any, httpResponse:any, body:any) =>{
              let result = (err) ? err : JSON.stringify(body);
              console.log("<p>"+result+"</p>");
            });
          }
        }
      })
    } else if(req.body.resultCode === 'R201') {
      const params = {
        resultMsg: '정상처리되었습니다.',
        resultCode: '0000',
        candyValue: 0
      }
      res.redirect(`/candyCharge/${JSON.stringify(params)}`)
    } else {
      // res.json({
      //   resultCode: req.body?.resultCode,
      //   resultMsg: req.body?.resultMsg,
      //   tid: req.body?.tid,
      //   MOID: req.body?.MOID,
      //   TotPrice: req.body?.TotPrice,
      //   goodName: req.body?.goodName,
      //   applDate: req.body?.applDate,
      //   applTime: req.body?.applTime
      // })
      console.log(" ============ error =====", JSON.stringify(req.body))
      const params = {
        resultMsg: req.body?.resultMsg,
        resultCode: req.body?.resultCode,
        candyValue: -1
      }
      res.redirect(`/candyCharge/${JSON.stringify(params)}`);
    }
  }
}

export const close = async (req: Request, res: Response) => {
  console.log("==========close start=========")
  console.log("body", req.body)
  console.log("query", req.query)
  console.log("==========close end=========")
  res.send('<script language="javascript" type="text/javascript" src="https://stdpay.inicis.com/stdjs/INIStdPay_close.js" charset="UTF-8"></script>');
}