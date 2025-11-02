'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileInfo {
  name: string
  path: string
  content: string
}

interface BuildConfig {
  appName: string
  version: string
  description: string
  author: string
  includeFiles: string[]
  excludePackages: string[]
  packages: string[]
  icon: string
  baseOption: string
}

export default function Home() {
  const [mainFile, setMainFile] = useState<FileInfo | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<FileInfo[]>([])
  const [config, setConfig] = useState<BuildConfig>({
    appName: 'MyApp',
    version: '1.0.0',
    description: '',
    author: '',
    includeFiles: [],
    excludePackages: [],
    packages: [],
    icon: '',
    baseOption: 'Console'
  })
  const [generatedCode, setGeneratedCode] = useState('')
  const [showConfig, setShowConfig] = useState(false)

  const onDropMain = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const reader = new FileReader()
      reader.onload = () => {
        setMainFile({
          name: file.name,
          path: file.name,
          content: reader.result as string
        })
      }
      reader.readAsText(file)
    }
  }, [])

  const onDropAdditional = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        setAdditionalFiles(prev => [...prev, {
          name: file.name,
          path: file.name,
          content: reader.result as string
        }])
      }
      reader.readAsText(file)
    })
  }, [])

  const { getRootProps: getMainRootProps, getInputProps: getMainInputProps, isDragActive: isMainDragActive } = useDropzone({
    onDrop: onDropMain,
    accept: { 'text/x-python': ['.py'] },
    multiple: false
  })

  const { getRootProps: getAdditionalRootProps, getInputProps: getAdditionalInputProps, isDragActive: isAdditionalDragActive } = useDropzone({
    onDrop: onDropAdditional,
    accept: {
      'text/x-python': ['.py'],
      'application/octet-stream': ['.pyd', '.dll'],
      'text/plain': ['.txt', '.json', '.xml', '.csv'],
      'image/*': ['.png', '.jpg', '.jpeg', '.ico']
    },
    multiple: true
  })

  const generateSetup = () => {
    const base = config.baseOption === 'GUI' ? 'Win32GUI' : 'Console'

    let setupCode = `import sys
from cx_Freeze import setup, Executable

# Dependencies are automatically detected, but may need fine tuning.
build_exe_options = {
    "packages": [${config.packages.map(p => `"${p}"`).join(', ')}],
    "excludes": [${config.excludePackages.map(p => `"${p}"`).join(', ')}],
    "include_files": [${config.includeFiles.map(f => `"${f}"`).join(', ')}]
}

# base="Win32GUI" should be used only for Windows GUI app
base = "${base}" if sys.platform == "win32" else None

executables = [
    Executable(
        "${mainFile?.name || 'main.py'}",
        base=base,
        ${config.icon ? `icon="${config.icon}",` : ''}
        target_name="${config.appName}.exe"
    )
]

setup(
    name="${config.appName}",
    version="${config.version}",
    description="${config.description}",
    author="${config.author}",
    options={"build_exe": build_exe_options},
    executables=executables
)
`

    setGeneratedCode(setupCode)
  }

  const generateBatchFile = () => {
    return `@echo off
echo Installing cx_Freeze...
pip install cx_Freeze

echo Building executable...
python setup.py build

echo Build complete! Check the 'build' folder for your executable.
pause
`
  }

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const downloadAll = () => {
    if (!mainFile) {
      alert('Please add a main Python file first')
      return
    }

    generateSetup()

    // Download main file
    downloadFile(mainFile.name, mainFile.content)

    // Download additional files
    additionalFiles.forEach(file => {
      downloadFile(file.name, file.content)
    })

    // Generate and download setup.py
    setTimeout(() => {
      downloadFile('setup.py', generatedCode || generateSetupCode())

      // Download build.bat
      setTimeout(() => {
        downloadFile('build.bat', generateBatchFile())
      }, 100)
    }, 100)
  }

  const generateSetupCode = () => {
    const base = config.baseOption === 'GUI' ? 'Win32GUI' : 'Console'

    return `import sys
from cx_Freeze import setup, Executable

build_exe_options = {
    "packages": [${config.packages.map(p => `"${p}"`).join(', ')}],
    "excludes": [${config.excludePackages.map(p => `"${p}"`).join(', ')}],
    "include_files": [${config.includeFiles.map(f => `"${f}"`).join(', ')}]
}

base = "${base}" if sys.platform == "win32" else None

executables = [
    Executable(
        "${mainFile?.name || 'main.py'}",
        base=base,
        ${config.icon ? `icon="${config.icon}",` : ''}
        target_name="${config.appName}.exe"
    )
]

setup(
    name="${config.appName}",
    version="${config.version}",
    description="${config.description}",
    author="${config.author}",
    options={"build_exe": build_exe_options},
    executables=executables
)
`
  }

  const removeAdditionalFile = (index: number) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-indigo-900">
          cx_Freeze EXE Builder
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Drag and drop your Python files to create a standalone executable
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - File Upload */}
          <div className="space-y-6">
            {/* Main Python File */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                1. Main Python File
              </h2>
              <div
                {...getMainRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  isMainDragActive
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                <input {...getMainInputProps()} />
                {mainFile ? (
                  <div>
                    <div className="text-green-600 mb-2">✓ File Added</div>
                    <p className="font-medium text-gray-800">{mainFile.name}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMainFile(null)
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600">
                      Drag & drop your main .py file here
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      or click to browse
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Files */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                2. Additional Files (Optional)
              </h2>
              <div
                {...getAdditionalRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all mb-4 ${
                  isAdditionalDragActive
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400'
                }`}
              >
                <input {...getAdditionalInputProps()} />
                <p className="text-gray-600">
                  Drag & drop additional files here
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  .py, .pyd, .dll, .txt, .json, images, etc.
                </p>
              </div>

              {additionalFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700">Added Files:</h3>
                  {additionalFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        onClick={() => removeAdditionalFile(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Configuration */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  3. Configuration
                </h2>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  {showConfig ? 'Hide' : 'Show'} Advanced
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Name *
                  </label>
                  <input
                    type="text"
                    value={config.appName}
                    onChange={(e) =>
                      setConfig({ ...config, appName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="MyApp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={config.version}
                    onChange={(e) =>
                      setConfig({ ...config, version: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="1.0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Type
                  </label>
                  <select
                    value={config.baseOption}
                    onChange={(e) =>
                      setConfig({ ...config, baseOption: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="Console">Console (Terminal Window)</option>
                    <option value="GUI">GUI (No Terminal)</option>
                  </select>
                </div>

                {showConfig && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={config.description}
                        onChange={(e) =>
                          setConfig({ ...config, description: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={2}
                        placeholder="Application description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Author
                      </label>
                      <input
                        type="text"
                        value={config.author}
                        onChange={(e) =>
                          setConfig({ ...config, author: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Include Packages (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={config.packages.join(', ')}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            packages: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s) => s),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="os, sys, json"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exclude Packages (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={config.excludePackages.join(', ')}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            excludePackages: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s) => s),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="tkinter, unittest"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon Path (optional)
                      </label>
                      <input
                        type="text"
                        value={config.icon}
                        onChange={(e) =>
                          setConfig({ ...config, icon: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="icon.ico"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Generate Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                4. Generate Setup Files
              </h2>

              <button
                onClick={generateSetup}
                disabled={!mainFile}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-4 font-medium"
              >
                Generate setup.py
              </button>

              {generatedCode && (
                <div className="space-y-4">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                    <pre className="text-sm">
                      <code>{generatedCode}</code>
                    </pre>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadFile('setup.py', generatedCode)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Download setup.py
                    </button>
                    <button
                      onClick={() =>
                        downloadFile('build.bat', generateBatchFile())
                      }
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Download build.bat
                    </button>
                  </div>

                  <button
                    onClick={downloadAll}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Download All Files
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            How to Build Your Executable
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Add your main Python file and any additional files needed</li>
            <li>Configure your application settings (name, version, etc.)</li>
            <li>Click "Generate setup.py" to create the setup configuration</li>
            <li>Download all files to a folder on your computer</li>
            <li>Double-click <code className="bg-gray-100 px-2 py-1 rounded">build.bat</code> or run: <code className="bg-gray-100 px-2 py-1 rounded">python setup.py build</code></li>
            <li>Find your executable in the <code className="bg-gray-100 px-2 py-1 rounded">build/</code> folder</li>
          </ol>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You need Python and cx_Freeze installed on your system to build the executable.
              Install cx_Freeze with: <code className="bg-white px-2 py-1 rounded">pip install cx_Freeze</code>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
