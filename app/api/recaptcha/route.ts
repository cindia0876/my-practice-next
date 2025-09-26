import { NextResponse } from 'next/server';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

export async function POST(req: Request) {
  console.log('[DEBUG] API route 被呼叫了');
  try {

    const client = new RecaptchaEnterpriseServiceClient();

    const { recaptchaToken, recaptchaAction } = await req.json();

    if (!recaptchaToken || !recaptchaAction) {
      return NextResponse.json({ error: 'Missing reCAPTCHA token or action' }, { status: 400 });
    }

    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
    const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!projectId || !recaptchaKey) {
      return NextResponse.json({ error: 'Server configuration error (missing project ID or site key)' }, { status: 500 });
    }

    const projectPath = client.projectPath(projectId);
    console.log('目前使用的 projectId:', projectId);

    const request = {
      assessment: {
        event: {
          token: recaptchaToken,
          siteKey: recaptchaKey,
        },
      },
      parent: projectPath,
    };

    const [response] = await client.createAssessment(request);
    const tokenProperties = response.tokenProperties;

    if (!tokenProperties?.valid) {
      return NextResponse.json({ error: 'Invalid token', reason: tokenProperties?.invalidReason }, { status: 400 });
    }

    if (tokenProperties.action !== recaptchaAction) {
      return NextResponse.json({ error: 'Action mismatch' }, { status: 400 });
    }

    const score = response.riskAnalysis?.score || 0;
    const reasons = response.riskAnalysis?.reasons || [];

    return NextResponse.json({ score, reasons }, { status: 200 });

  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


// import type { NextApiRequest, NextApiResponse } from 'next';
// import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

// // 建立 reCAPTCHA 用戶端
// const client = new RecaptchaEnterpriseServiceClient();

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   const { recaptchaToken, recaptchaAction } = req.body;

//   if (!recaptchaToken || !recaptchaAction) {
//     return res.status(400).json({ error: 'Missing reCAPTCHA token or action' });
//   }

//   const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
//   const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

//   if (!projectId || !recaptchaKey) {
//     return res.status(500).json({ error: 'Server configuration error (missing project ID or site key)' });
//   }

//   try {
//     const projectPath = client.projectPath(projectId);

//     const request = {
//       assessment: {
//         event: {
//           token: recaptchaToken,
//           siteKey: recaptchaKey,
//         },
//       },
//       parent: projectPath,
//     };

//     const [response] = await client.createAssessment(request);

//     const tokenProperties = response.tokenProperties;

//     if (!tokenProperties?.valid) {
//       console.log('Invalid token:', tokenProperties?.invalidReason);
//       return res.status(400).json({ error: 'Invalid token', reason: tokenProperties?.invalidReason });
//     }

//     if (tokenProperties.action !== recaptchaAction) {
//       console.log('Action mismatch');
//       return res.status(400).json({ error: 'Action mismatch' });
//     }

//     const score = response.riskAnalysis?.score || 0;
//     const reasons = response.riskAnalysis?.reasons || [];

//     console.log(`Score: ${score}`);
//     console.log('Reasons:', reasons);

//     return res.status(200).json({ score, reasons });

//   } catch (error) {
//     console.error('Error during reCAPTCHA verification:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// }
