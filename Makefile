
build:
	docker build -t pietvanzoen:file-server .

run:
	docker run -d -v ${CURDIR}/data:/data -p 4500:4500 pietvanzoen:file-server

test:
	wget -qO- 0.0.0.0:4500/test.png || exit 1
