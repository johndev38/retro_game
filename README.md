# Retro Agile Quest

Jeu web multijoueur rétro (style old-school) pour animer des rétros agiles.

## Lancer le serveur

```bash
node server.js
```

Puis ouvrir http://localhost:3000.

## Vérifications


### Lancer une démo (ouvre le navigateur automatiquement)

```bash
npm run demo
```

Sur Windows PowerShell, cette commande fonctionne aussi.

### Vérification syntaxe

```bash
npm run check
```

### Smoke test cross-platform (Windows, macOS, Linux)

Ce test démarre le serveur, appelle `/api/join`, valide la réponse puis arrête le serveur automatiquement.

```bash
npm run smoke
```

## Note pour Windows PowerShell

La commande shell Linux ci-dessous n'est **pas compatible PowerShell** :

```bash
node server.js > /tmp/retro.log 2>&1 & echo $! > /tmp/retro_pid && sleep 1 && curl ...
```

Utilisez plutôt :

```powershell
npm run smoke
```

ou bien en manuel PowerShell :

```powershell
$server = Start-Process node -ArgumentList 'server.js' -PassThru
Start-Sleep -Seconds 1
Invoke-RestMethod -Uri 'http://localhost:3000/api/join' -Method Post -ContentType 'application/json' -Body '{"name":"Alice","room":"TEAM1"}'
Stop-Process -Id $server.Id
```
