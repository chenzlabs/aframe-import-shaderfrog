// This function processes the ShaderFrog JSON export for Three.js.
function importShaderFrog(shaderName, importedShaderJSON, defaults) {
    // Parse the shader JSON.
    importedShaderJSON = JSON.parse(importedShaderJSON);

    // Create the AFRAME shader template.
    var importedShader = {
        raw: true,
        schema: {},
        vertexShader: importedShaderJSON.vertex,
        fragmentShader: importedShaderJSON.fragment
    };

    // This maps (name and) JSON glslType to AFRAME shader schema type.
    function remap(key, type) {
        if (key === 'time') return 'time';
        if (key === 'color') return 'color';
        if (type === 'sampler2D') return 'map';
        if (type === 'float') return 'number';
        return type;
    }

    // This maps (name and) JSON glslType to AFRAME shader schema default.
    function remapDefault(key, type) {
        if (key === 'time') return 0;
        if (type === 'vec2') return { x: 0, y: 0 };
        if (type === 'vec3') return { x: 0, y: 0, z: 0 };
        if (type === 'float') return 0;
        return undefined;
    }

    // Build schema from uniforms, remapping type as appropriate.
    Object.keys(importedShaderJSON.uniforms).map(function (key) {
        importedShader.schema[key] = {
            is: 'uniform',
            type: remap(key, importedShaderJSON.uniforms[key].glslType),
            default: (defaults && defaults[key]) || importedShaderJSON.uniforms[key].value || remapDefault(key, importedShaderJSON.uniforms[key].glslType)
        };
    });

    // FIXME: in A-Frame, time uniforms are in msec, not seconds
    if (importedShader.schema.time) {
        // replace the definition of uniform time with time1000
        var fragmentShader = importedShader.fragmentShader.replace('uniform float time;', 'uniform float time1000;\nfloat time;');
        importedShader.schema.time1000 = importedShader.schema.time;
        delete importedShader.schema.time;

        // find the right place to insert time1000 division, and do it
        var mainIndex = fragmentShader.indexOf('main(');
        var insertCodeIndex = fragmentShader.indexOf('{', mainIndex) + 1;
        importedShader.fragmentShader = fragmentShader.substring(0, insertCodeIndex) + 'time = time1000 / 1000.0;\n' + fragmentShader.substring(insertCodeIndex);
    }

    // register the shader with A-Frame
    AFRAME.registerShader(shaderName, importedShader);
}

if (AFRAME && AFRAME.utils) { AFRAME.utils.importShaderFrog = importShaderFrog; }
