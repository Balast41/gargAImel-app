Charger les images Dockers

docker load gargaimel-app.tar
docker load gargaimel-app-tts.tar

Une fois les images chargées, se rendre sur localhost:8080 ou se trouve langflow
Charger le flow Memory Chatbot.json dans langflow

Modifier l'url de l'API Ollama avec http://host.docker.internal:11434/
Executer les commande suivantes avec l'id docker ollama
docker exec -it <id_docker> ollama signin
docker exec -it ollama pull gpt-oss:120b-cloud
Une fois les commandes exécutées, changer le modèle en gpt-oss:120b-cloud

si les images docker ne sont pas lancées, les lancer avec :

docker compose up

ou

#Node.js & npm
npm run docker:up

Se rendre sur localhost:6080/vnc_auto.html et appuyer sur se connecter
vous avez accès à l'application

Pour la version .exe, décompresser l'archive gargAimel-win32-x64.zip
lancer le .exe
vous avez accès à l'application