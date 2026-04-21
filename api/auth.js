export default function handler(req, res) {
    const { code } = req.body;
    const SECRET_CODE = process.env.ACCESS_CODE; // Diambil dari Vercel Env

    if (code === SECRET_CODE) {
        return res.status(200).json({ authenticated: true });
    } else {
        return res.status(401).json({ authenticated: false });
    }
}
