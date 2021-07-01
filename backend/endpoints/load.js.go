package endpoints

import "github.com/ihucos/counter.dev/lib"

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		files1, err := filepath.Glob("../static/components/*.js")
		ctx.CatchError(err)
		files2, err := filepath.Glob("../static/components/*/*.js")
		ctx.CatchError(err)
		files3, err := filepath.Glob("../static/components/*/*/*.js")
		ctx.CatchError(err)
		files := append(append(files1, files2...), files3...)

		serveableFiles := []string{}
		for _, file := range files{
			serveableFiles = append(serveableFiles, file[9:])
		}


		// this works, but breaks the frontend - you fix it!
		for _, file := range serveableFiles {
			ctx.W.Header().Add("Link", fmt.Sprintf("<%s>; rel=preload; as=script", file))
		}

		filesJson, err := json.Marshal(serveableFiles)
		ctx.CatchError(err)
		ctx.Return(fmt.Sprintf(`
	        %s.sort().map(file => {
	            let script = document.createElement("script");
	            script.src = file; script.async = false;
	            document.head.appendChild(script)})`, filesJson), 200)
	})
}
