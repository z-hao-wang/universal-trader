{
  "targets": [
    {
      "target_name": "py",
      'xcode_settings': {
        'OTHER_CFLAGS': [
          '-ObjC'
        ],
      },
      "cflags!": [ "-fno-exceptions", "<!(python3-config --cflags)" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "libraries": [ "/usr/local/lib/libpython3.7m.so" ],
      "link_settings": {
        'conditions': [
          ['OS == "mac"', {
            "ldflags": [],
          }],
          ['OS == "linux"', {
            "ldflags": [
              "<!(python3-config --ldflags)",
            ],
          }]
        ],
      },
      "sources": [ "src/python.cc", "src/pythonBinding/pythontrader.cc" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<!(python3-config --includes)"
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    }
  ]
}
