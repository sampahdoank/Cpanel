export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // ==== Fukushima Cpanel Setting ======
    const config = {
        egg: "15",
        nestid: "5",
        loc: "1",
        domain: "https://kimgenone.cloud-hosting.biz.id",
        apikey: "ptla_sBK3yiNEVjlc1mRcHllNpSxj0lrU5bQmfPAJFwYGkN5",
        capikey: "ptlc_JHmTBAKcVZeoDnPwp8KPxDfvL3dDFuz2mDN8yLQtopm",
        botname: "Fukushima Panel"
    };

    try {
        const { username, plan } = req.body;

        // Validasi input
        if (!username || !username.match(/^[a-z0-9]+$/i)) {
            return res.status(400).json({ message: 'Username hanya boleh huruf dan angka' });
        }

        if (!plan) {
            return res.status(400).json({ message: 'Pilih plan terlebih dahulu' });
        }

        // Tentukan spesifikasi server
        let ram, disk, cpu;
        switch (plan) {
            case "1gb": ram = "1000"; disk = "1000"; cpu = "40"; break;
            case "2gb": ram = "2000"; disk = "1000"; cpu = "60"; break;
            case "3gb": ram = "3000"; disk = "2000"; cpu = "80"; break;
            case "4gb": ram = "4000"; disk = "2000"; cpu = "100"; break;
            case "5gb": ram = "5000"; disk = "3000"; cpu = "120"; break;
            case "6gb": ram = "6000"; disk = "3000"; cpu = "140"; break;
            case "7gb": ram = "7000"; disk = "4000"; cpu = "160"; break;
            case "8gb": ram = "8000"; disk = "4000"; cpu = "180"; break;
            case "9gb": ram = "9000"; disk = "5000"; cpu = "200"; break;
            case "10gb": ram = "10000"; disk = "5000"; cpu = "220"; break;
            case "unlimited": ram = "0"; disk = "0"; cpu = "0"; break;
            default: return res.status(400).json({ message: 'Plan tidak valid' });
        }

        // Buat password acak
        const password = username + Math.random().toString(36).slice(2, 6);
        const email = `${username}@gmail.com`;
        const name = username;
        const tglini = new Date().toLocaleString();
        const desc = `DIBUAT TANGGAL : ${tglini}\nOleh : ${config.botname}`;

        // Langkah 1: Buat akun user
        const userResponse = await fetch(`${config.domain}/api/application/users`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.apikey}`
            },
            body: JSON.stringify({
                email: email,
                username: username,
                first_name: name,
                last_name: "Server",
                language: "en",
                password: password
            })
        });

        const userData = await userResponse.json();
        if (!userResponse.ok) {
            const errorMsg = userData.errors ? userData.errors[0].detail : 'Gagal membuat user';
            throw new Error(`API Error: ${errorMsg}`);
        }

        const userId = userData.attributes.id;

        // Langkah 2: Dapatkan config egg
        const eggResponse = await fetch(`${config.domain}/api/application/nests/${config.nestid}/eggs/${config.egg}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.apikey}`
            }
        });

        const eggData = await eggResponse.json();
        if (!eggResponse.ok) {
            throw new Error('Gagal mendapatkan config egg');
        }

        const startupCmd = eggData.attributes.startup;

        // Langkah 3: Buat server
        const serverResponse = await fetch(`${config.domain}/api/application/servers`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.apikey}`
            },
            body: JSON.stringify({
                name: name,
                description: desc,
                user: userId,
                egg: parseInt(config.egg),
                docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
                startup: startupCmd,
                environment: {
                    INST: "npm",
                    USER_UPLOAD: "0",
                    AUTO_UPDATE: "0",
                    JS_FILE: "index.js",
                    CMD_RUN: "npm start"
                },
                limits: {
                    memory: parseInt(ram),
                    swap: 0,
                    disk: parseInt(disk),
                    io: 500,
                    cpu: parseInt(cpu)
                },
                feature_limits: {
                    databases: 5,
                    backups: 5,
                    allocations: 5
                },
                deploy: {
                    locations: [parseInt(config.loc)],
                    dedicated_ip: false,
                    port_range: []
                }
            })
        });

        const serverData = await serverResponse.json();
        if (!serverResponse.ok) {
            const errorMsg = serverData.errors ? serverData.errors[0].detail : 'Gagal membuat server';
            throw new Error(`API Error: ${errorMsg}`);
        }

        // Format tampilan RAM dan Disk
        const formatResource = (value) => {
            if (value === "0") return "Unlimited";
            return value.length > 4 ? value.slice(0, 2) + "GB" : value.charAt(0) + "GB";
        };

        // Response sukses
        res.status(200).json({
            success: true,
            id: serverData.attributes.id,
            username: username,
            password: password,
            ram: formatResource(ram),
            cpu: cpu === "0" ? "Unlimited" : cpu + "%",
            disk: formatResource(disk),
            web: config.domain,
            created: tglini,
            notes: [
                "1x Replace",
                "Ss Bukti .DONE",
                "Hubungi Owner kalau ada masalah",
                "Jangan pakai SC DDOS",
                "Jangan DDOS DOMAIN",
                "Jangan sebar domain"
            ]
        });

    } catch (error) {
        console.error('[FUKUSHIMA ERROR]', error);
        res.status(500).json({ 
            success: false,
            message: error.message,
            details: error.stack
        });
    }
}